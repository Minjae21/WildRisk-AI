'''
Demo file for Gradio

It is recommended to create a virtual environment (venv)
for sake of consistency of libraries. Run in terminal under software dir:

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

In order to run the demo file, type in terminal:

python3 demo.py

'''
import gradio as gr

def generate_fake_image(prompt, seed, initial_image=None):
    return f"Used seed: {seed}", "https://dummyimage.com/300/09f.png"

demo = gr.Interface(
    generate_fake_image,
    inputs=["textbox"],
    outputs=["textbox", "image"],
    additional_inputs=[
        gr.Slider(0, 1000),
        "image"
    ]
)

demo.launch()