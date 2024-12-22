from googletrans import Translator

def detect_and_translate_to(text: str, target_lan: str, lims=('lv','en')) -> str:
    text = text.replace('.', ' ')
    if not text:
        return ''
    translator = Translator()
    
    # Detect the language of the input text
    detected_lang = translator.detect(text).lang
    if lims is not None:
        if detected_lang not in lims:
            return text
        
    # If the language is not target_lan, translate to target_lan
    if detected_lang != target_lan:
        translated = translator.translate(text, src=detected_lang, dest=target_lan)
        return translated.text
    else:
        return text  # If already in target_lan, return as is
    
def detect_language(text:str) -> str:
    translator = Translator()
    detected_lang = translator.detect(text).lang
    return detected_lang