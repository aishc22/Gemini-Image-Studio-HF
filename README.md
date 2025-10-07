# **Gemini-Image-Studio-HF**

A state-of-the-art image generation and editing tool powered by Google's Generative AI models. This React-based web application allows users to generate images from text prompts, edit existing images, or create images from hand-drawn sketches. It supports multiple modes, customizable settings, and a user-friendly interface with light/dark theme toggling.

This nodejs proxy server lets you run your AI Studio Gemini application unmodified, without exposing your API key in the frontend code.

> [!warning]
To proceed, you need to add your Gemini API key. Your API key is stored only for the duration of your session and will be lost when you reload or exit the page. It will not be shared or exposed anywhere.

<img width="1920" height="851" alt="Screenshot 2025-10-07 at 20-01-34 Gemini Image Studio - a Hugging Face Space by prithivMLmods" src="https://github.com/user-attachments/assets/db08db8e-0821-4647-a32e-580faf1ed00b" />
<img width="1920" height="1030" alt="brSEP_AyMb_2unV5MN3x0" src="https://github.com/user-attachments/assets/61bd29f3-de93-4698-bf72-6a3396ea56d5" />
<img width="1920" height="1071" alt="F0kGV0_-22UB40tqYzOpG" src="https://github.com/user-attachments/assets/a6809ae9-ae6b-4249-901d-9c19a07308ea" />
<img width="1920" height="1068" alt="9j1IOk93TqIERjoSAOzfW" src="https://github.com/user-attachments/assets/3ec9020a-d1af-43cb-b296-54d658154971" />
<img width="1920" height="1030" alt="7aziQkY7EgGK03Ya9hzj9" src="https://github.com/user-attachments/assets/3351ee8e-5f27-4e0b-961c-c43365baef17" />
<img width="1920" height="1381" alt="HXwM8diiugfll90Fz32OD" src="https://github.com/user-attachments/assets/91befcac-d0d6-4c46-9272-67bbdae5e6af" />
<img width="1920" height="1381" alt="HOpfNij2rlBrV-aeUPquB" src="https://github.com/user-attachments/assets/ade87fee-3ca6-4bf2-be07-c1bdc1f7fc1f" />

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
