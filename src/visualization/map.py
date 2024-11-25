from shapely.geometry import LineString, Point
from folium.plugins import MarkerCluster
from copy import copy
import folium


def map_viz(route=None, markers=None, buffer=None, coord_start=None, zoom_start=15):
    """
    route: shapely LineString -> list of tuples with (lon,lat)
    """
    route_linestring = copy(route)
    route = [(point[1], point[0]) for point in route.coords]  # convert from (lon, lat) to (lat, lon)

    if coord_start is None:
        first_point = route[0]

    m = folium.Map(location=[*first_point], zoom_start=zoom_start)

    folium.PolyLine(route, color="blue", weight=2.5, opacity=1).add_to(m)

    # marker_cluster = MarkerCluster().add_to(m)
    if markers is not None:
        for poi in markers:
            folium.Marker(
                location=(poi['lat'], poi['lon']),
                popup=f"{poi['name']}",
                icon=folium.Icon(color='red', icon='info-sign')
            ).add_to(m)

    if buffer is not None:
        route_buffer = route_linestring.buffer(buffer)
        buffer_coords = list(route_buffer.exterior.coords)  # Get the coordinates of the buffer polygon
        folium.Polygon(locations=[(point[1], point[0]) for point in buffer_coords], color='green', fill=True, fill_opacity=0.2).add_to(m)

    return m