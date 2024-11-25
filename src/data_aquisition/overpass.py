import requests
from typing import List
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points
import math

DEGRESS_TO_METERS = 111000
METERS_TO_DEGRESS = 1 / DEGRESS_TO_METERS

import src.processing.path_processing as path_processing

def create_overpass_query(center_lat, center_lon, tags: list, radius: int) -> str:
    """
    Creates an Overpass API query to retrieve POIs based on bounding box and tags.
    """
    
    query = f"[out:json];\n("

    for tag in tags:
        query += f'  node["{tag}"](around:{radius},{center_lat},{center_lon});\n'
        query += f'  way["{tag}"](around:{radius},{center_lat},{center_lon});\n'
        query += f'  relation["{tag}"](around:{radius},{center_lat},{center_lon});\n'

    query += ");\nout body;"
    return query


def fetch_pois_from_overpass(query: str) -> dict:
    """
    Fetches POIs from Overpass API using a generated query.
    """
    overpass_url = "http://overpass-api.de/api/interpreter"
    response = requests.get(overpass_url, params={'data': query})
    return response.json()

def fetch_node_coordinates(node_ids: List[int]) -> dict:
    """
    Fetch coordinates for nodes given a list of node IDs, breaking them into batches to avoid 400 error.
    """
    overpass_url = "http://overpass-api.de/api/interpreter"

    node_query = f"""
    [out:json];
    (node({node_ids[0]}););
    out body;
    """
    response = requests.get(overpass_url, params={'data': node_query})
    nodes_coordinates = {}

    nodes_data = response.json()
    for node in nodes_data['elements']:
        nodes_coordinates[node['id']] = (node['lat'], node['lon'])

    return nodes_coordinates

def filter_pois_near_path(pois: list, path: LineString, max_distance: float) -> list:
    """
    Filters POIs that are within a specified distance from the path.
    """
    filtered_pois = []

    for element in pois:
        # Determine coordinates based on element type (node, way, or relation)
        if 'lat' in element and 'lon' in element:  # For node
            poi_point = Point(element['lon'], element['lat'])
        elif 'nodes' in element:  # For way or relation
            # Fetch node coordinates for ways or relations
            node_ids = element['nodes']  # List of node IDs
            node_coordinates = fetch_node_coordinates(node_ids)  # Get node lat/lon

            # Calculate the average coordinates for the nodes in the way
            lat_sum = 0
            lon_sum = 0
            valid_nodes = 0

            for node_id in node_ids:
                if node_id in node_coordinates:
                    lat, lon = node_coordinates[node_id]
                    lat_sum += lat
                    lon_sum += lon
                    valid_nodes += 1

            # If valid nodes are found, calculate the average
            if valid_nodes > 0:
                avg_lat = lat_sum / valid_nodes
                avg_lon = lon_sum / valid_nodes
                poi_point = Point(avg_lon, avg_lat)  # Create point from average coordinates
            else:
                continue 
        else:
            continue

        # Find the nearest point on the path
        nearest = nearest_points(path, poi_point)  # Find nearest point on the path
        distance = nearest[0].distance(poi_point)  # Calculate distance

        if distance < max_distance:  # Distance threshold (in degrees)
            filtered_pois.append({
                'name': element.get('tags', {}).get('name', None),
                'lat': element.get('lat', None),  # Include lat/lon in the result
                'lon': element.get('lon', None),
                'type': element.get('tags', {}).get('historic', 'No type')
            })

    return filtered_pois


def get_pois_near_path(path: LineString, buffer_distance: float = 20, max_distance: float = 20) -> list:
    """
    Combines the steps to retrieve and filter POIs near the path.
    """
    tags = ["historic", "tourism"]

    # fit circle around the path bbox
    bbox = path_processing.get_bounding_box(path)
    center_lat = (bbox[1] + bbox[3]) / 2
    center_lon = (bbox[0] + bbox[2]) / 2

    # convert to meters
    bbox = [el*DEGRESS_TO_METERS for el in bbox]
    
    expanded_bbox = (bbox[0] - buffer_distance, bbox[1] - buffer_distance,
                     bbox[2] + buffer_distance, bbox[3] + buffer_distance)
    
    bbox_width = expanded_bbox[2] - expanded_bbox[0]
    bbox_height = expanded_bbox[3] - expanded_bbox[1]
    radius = math.sqrt(bbox_width ** 2 + bbox_height ** 2)
    max_distance = max_distance*METERS_TO_DEGRESS

    # get Overpass API query
    query = create_overpass_query(center_lat, center_lon, tags, radius)
    # get all objects in the circle
    pois_data = fetch_pois_from_overpass(query)

    # filter objects based on proximity to the path
    filtered_pois = filter_pois_near_path(pois_data['elements'], path, max_distance)
    
    return filtered_pois