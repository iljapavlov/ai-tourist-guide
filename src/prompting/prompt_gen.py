from transformers import pipeline

# Initialize the LLM pipeline
if False:
    generator = pipeline("text-generation", model="gpt-4")

def generate_prompt(article_text, user_preferences):
    prompt = f"""
    Transform the following text into a tourist guide narrative. Make sure not to exceed 5 sentences.
    User preferences:
    - Interests: {", ".join(user_preferences["interests"])}.
    - Style: {user_preferences["style"]}.
    Text:
    "{article_text}"
    """
    return prompt

def generate_tourist_narrative(article_text, user_preferences):
    """Generates a personalized tourist guide narrative."""
    prompt = generate_prompt(article_text, user_preferences)
    result = generator(prompt, max_length=300, num_return_sequences=1)
    return result[0]["generated_text"]

