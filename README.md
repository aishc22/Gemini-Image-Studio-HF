# **Gemini-Image-Studio-HF**

A state-of-the-art image generation and editing tool powered by Google's Generative AI models. This React-based web application allows users to generate images from text prompts, edit existing images, or create images from hand-drawn sketches. It supports multiple modes, customizable settings, and a user-friendly interface with light/dark theme toggling.

This nodejs proxy server lets you run your AI Studio Gemini application unmodified, without exposing your API key in the frontend code.

> [!warning]
To proceed, you need to add your Gemini API key. Your API key is stored only for the duration of your session and will be lost when you reload or exit the page. It will not be shared or exposed anywhere.

<img width="1920" height="913" alt="Screenshot 2025-10-07 at 19-39-44 Gemini Image Studio - a Hugging Face Space by prithivMLmods" src="https://github.com/user-attachments/assets/1fc1d450-14ac-4fd2-aeea-b81c8cd7defc" />
<img width="1920" height="1030" alt="brSEP_AyMb_2unV5MN3x0" src="https://github.com/user-attachments/assets/252cf942-3c6d-441d-b8fe-26269822715d" />
<img width="1920" height="1068" alt="9j1IOk93TqIERjoSAOzfW" src="https://github.com/user-attachments/assets/de370e76-8cc4-4ad4-89a1-d86d9b309589" />
<img width="1920" height="1030" alt="7aziQkY7EgGK03Ya9hzj9" src="https://github.com/user-attachments/assets/dd139afc-196e-44b5-9313-0017b461b716" />
<img width="1920" height="1071" alt="F0kGV0_-22UB40tqYzOpG" src="https://github.com/user-attachments/assets/0f43c68f-a6f3-4b25-997e-c3d473338993" />
<img width="1920" height="1381" alt="HXwM8diiugfll90Fz32OD" src="https://github.com/user-attachments/assets/b5e9a912-30f4-49ff-bf10-766c4f027645" />
<img width="1920" height="1381" alt="HOpfNij2rlBrV-aeUPquB" src="https://github.com/user-attachments/assets/a0af876f-1b99-4e25-a31e-1f7716e01ed4" />


---

## Instructions

**Prerequisites**:
- [Google Cloud SDK / gcloud CLI](https://cloud.google.com/sdk/docs/install)
- (Optional) Gemini API Key

1. Download or copy the files of your AI Studio app into this directory at the root level.
2. If your app calls the Gemini API, create a Secret for your API key:
     ```
     echo -n "${GEMINI_API_KEY}" | gcloud secrets create gemini_api_key --data-file=-
     ```

3.  Deploy to Cloud Run (optionally including API key):
    ```
    gcloud run deploy my-app --source=. --update-secrets=GEMINI_API_KEY=gemini_api_key:latest
    ```
