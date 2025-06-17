from ollama import chat
from ollama import ChatResponse

class OllamaChatModel:
    def __init__(self, model_name="gemma3:4b"):
        self.model_name = model_name

    def generate_response(self, messages):
        response: ChatResponse = chat(
            model=self.model_name,
            messages=messages,
            options={"temperature": 0.5}
        )
        return response['message']['content']

    def ask_about_image(self, img_path, question):
        messages = [
            {"role": "system", "content": "이미지에 대한 질문에 답변합니다."},
            {"role": "user", "content": f"질문: {question}", "images": [img_path]},
        ]
        response = self.generate_response(messages)
        return response

class PhotoAnalyzer:
    def __init__(self):
        self.model = OllamaChatModel()

    def check_image_relevance(self, image_path, topic):
        """
        이미지가 주제에 맞는지 판별합니다.
        Returns:
            {
                "passed": True/False,
                "reason": "판단 근거 텍스트"
            }
        """
        question = f"이 이미지에 '{topic}'와 관련된 내용이 있나요? 관련 있다면 이유를 설명해주세요. 없다면 왜 없는지 설명해주세요."
        response = self.model.ask_about_image(image_path, question)

        passed = any(keyword in response.lower() for keyword in [
            "있습니다", "보입니다", "포함", "보여집니다", "존재", "확인됩니다"
        ]) and not any(neg in response.lower() for neg in ["없", "아닙", "모르겠"])

        return {
            "passed": passed,
            "reason": response.strip()
        }
