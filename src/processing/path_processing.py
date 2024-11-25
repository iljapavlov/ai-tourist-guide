from shapely.geometry import LineString, Point
from shapely.ops import nearest_points


def get_bounding_box(path: LineString) -> tuple:
    """
    Given a path (LineString), return the bounding box with an optional buffer.
    """
    bbox = path.bounds  # (min_lon, min_lat, max_lon, max_lat)
    return bbox