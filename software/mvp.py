import gradio as gr
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

def create_gauge(value):
  fig, ax = plt.subplots(figsize=(4, 2.5))
  theta = np.linspace(0.75 * np.pi, 0.25 * np.pi, 100)
  r = 0.8
  x = r * np.cos(theta)
  y = r * np.sin(theta)
  
  segment_colors = ['#62ca5b', '#cabd5b', '#ca5b5b']
  for i, color in enumerate(segment_colors):
    segment_theta = np.linspace(0.75 * np.pi - i * 0.5 * np.pi / 3, 0.75 * np.pi - (i + 1) * 0.5 * np.pi / 3, 30)
    segment_x = r * np.cos(segment_theta)
    segment_y = r * np.sin(segment_theta)
    ax.plot(segment_x, segment_y, color=color, linewidth=10)
  
  bg_theta = np.linspace(0.75 * np.pi - 0.5 * np.pi, 0.25 * np.pi, 50)
  bg_x = r * np.cos(bg_theta)
  bg_y = r * np.sin(bg_theta)
  ax.plot(bg_x, bg_y, color='#e0e0e0', linewidth=10)
  
  needle_value = value / 10
  needle_angle = 0.75 * np.pi - needle_value * 0.5 * np.pi
  needle_x = [0, r * 0.9 * np.cos(needle_angle)]
  needle_y = [0, r * 0.9 * np.sin(needle_angle)]
  ax.plot(needle_x, needle_y, 'k-', linewidth=2)
  circle = plt.Circle((0, 0), 0.05, facecolor='black', zorder=10)
  ax.add_patch(circle)
  
  ax.text(-0.7, -0.2, "Low Risk (1)", fontsize=8)
  ax.text(0.35, -0.2, "High Risk (10)", fontsize=8)
  
  risk_text = "High Risk" if value > 6 else "Medium Risk" if value > 3 else "Low Risk"
  ax.text(0, 0.2, f"{risk_text}", fontsize=10, ha='center')
  
  current_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
  ax.text(-0.7, -0.4, f"Last Updated: {current_date}", fontsize=8)
  
  ax.set_xlim(-1, 1)
  ax.set_ylim(-0.5, 1)
  ax.axis('off')
  plt.tight_layout()
  
  return fig

def create_comparison_chart():
  fig, ax = plt.subplots(figsize=(5, 3))
  
  categories = ['Your Location', 'City Average', 'County Average', 'Similar Areas']
  values = [7, 5, 6, 6.5]
  colors = ['#e74c3c', '#f39c12', '#f39c12', '#e74c3c']
  
  bars = ax.bar(categories, values, color=colors, width=0.6)
  
  for bar, value in zip(bars, values):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1, str(value), 
      ha='center', va='bottom', fontsize=9)
  
  ax.set_ylim(0, 10)
  ax.set_yticks([0, 2, 4, 6, 8, 10])
  ax.grid(axis='y', linestyle='--', alpha=0.7)
  
  ax.spines['top'].set_visible(False)
  ax.spines['right'].set_visible(False)
  
  plt.tight_layout()
  return fig

def create_map_placeholder():
  fig, ax = plt.subplots(figsize=(4, 4))
  ax.set_facecolor('#e0e0e0')
  
  ax.grid(True, linestyle='--', alpha=0.6)
  
  ax.text(0.5, 0.5, "Map View", fontsize=14, ha='center', va='center')
  
  ax.set_xticks([])
  ax.set_yticks([])
  
  for spine in ax.spines.values():
    spine.set_visible(True)
    spine.set_color('#aaaaaa')
  
  plt.tight_layout()
  return fig

def analyze_risk(address, date=None):
  risk_factors = [
    "Vegetation density near property",
    "Historical fire incidents",
    "Distance to nearest fire station",
    "Local weather patterns"
  ]
  
  risk_score = 7
  
  details = """The property is located in a region with high vegetation density and seasonal dry conditions. Historical data shows multiple fire incidents within a 5-mile radius over the past decade. The nearest fire station is approximately 3.5 miles away, which is farther than the recommended distance for high-risk areas. Local weather patterns indicate high-wind seasons that could accelerate fire spread."""
  
  gauge_fig = create_gauge(risk_score)
  comparison_fig = create_comparison_chart()
  map_fig = create_map_placeholder()
  
  return gauge_fig, details, map_fig, comparison_fig

with gr.Blocks() as demo:
  gr.Markdown("# FireLMM - Wildfire Risk Assessment")
  gr.Markdown("Advanced wildfire risk assessment powered by AI")
  
  with gr.Row(variant="compact"):
    with gr.Column():
      gr.Markdown("## Assess Your Fire Risk")
      gr.Markdown("Enter your location and date to get a personalized risk assessment")
      
      with gr.Row():
        with gr.Column():
          location = gr.Textbox(label="Location", placeholder="123 Main St, City, State")
        with gr.Column():
          date = gr.DateTime(label="Date")
        with gr.Column():
          submit_btn = gr.Button("Get Risk Assessment")

  with gr.Row(variant="compact"):
    with gr.Column(scale=1):
      gr.Markdown("## Risk Score")
      risk_plot = gr.Plot(label="Current Risk")
    with gr.Column(scale=2):
      gr.Markdown("## Risk Factors")
      risk_details = gr.Textbox(label="Understanding what contributes to your risk score", lines=6, interactive=False)

  with gr.Row(variant="compact"):
    with gr.Column():
      gr.Markdown("## Fire History & Risk Map")
      map_plot = gr.Plot(label="Historical fires and current risk areas")

  with gr.Row(variant="compact"):
    with gr.Column():
      gr.Markdown("## Neighborhood Comparison")
      comparison_plot = gr.Plot(label="How your area compares to similar neighborhoods")
  
  submit_btn.click(
    fn=analyze_risk,
    inputs=[location, date],
    outputs=[risk_plot, risk_details, map_plot, comparison_plot]
  )

demo.launch()