import wikipediaapi

# Function to fetch Wikipedia content using the Wikipedia API
def fetch_wikipedia_article(poi_name: str, language: str = "en", return_summary = True) -> str:
    """
    Fetches the Wikipedia article content for a given POI name.

    :param poi_name: The name of the Point of Interest (POI).
    :param language: The language code for the Wikipedia article (default is English).
    :return: The article summary or content, or a message if not found.
    """
    wiki = wikipediaapi.Wikipedia('MyProjectName (test@example.com)', language)
    page = wiki.page(poi_name)

    if not page.exists():
        return None
    
    if return_summary:
        return page.summary
    else:
        return page.text