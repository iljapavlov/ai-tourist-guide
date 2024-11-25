from googletrans import Translator

def detect_and_translate_to_english(text: str) -> str:
    if not text:
        return ''
    translator = Translator()
    
    # Detect the language of the input text
    detected_lang = translator.detect(text).lang
    
    # If the language is not English, translate to English
    if detected_lang != 'en':
        translated = translator.translate(text, src=detected_lang, dest='en')
        return translated.text
    else:
        return text  # If already in English, return as is
    
def detect_language(text:str) -> str:
    translator = Translator()
    detected_lang = translator.detect(text).lang
    return detected_lang