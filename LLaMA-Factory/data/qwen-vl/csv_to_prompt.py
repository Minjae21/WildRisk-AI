import pandas as pd
import json
import os

# config
csv_path = "wildfire_dataset.csv"
image_path = "bobcat_fire.jpeg"
output_json = "wildfire_sample.json"
output_dir = "data/qwem-vl"

os.makedirs(output_dir, exist_ok=True)
df = pd.read_csv(csv_path)

def make_prompt(row):
    return f"Tell me about the '{row['FIRE_NAME']}' that occurred in {row['STATE']} in {row['FIRE_YEAR']}."

def make_response(row):
    return f"The fire named '{row['FIRE_NAME']}' occurred in {row['STATE']} in {row['FIRE_YEAR']}. It burned approximately {row['FIRE_SIZE']} acres and was classified as size class '{row['FIRE_SIZE_CLASS']}'."

data = []
for _, row in df.iterrows():
    convo = {
        "conversations": [
            {"from": "user", "value": make_prompt(row)},
            {"from": "gpt", "value": make_response(row)}
        ],
        "image": image_path
    }
    data.append(convo)

#  convert to JSON
with open(os.path.join(output_dir, output_json), "w") as f:
    json.dump(data, f, indent=2)

print(f"✅ JSON saved to {os.path.join(output_dir, output_json)}")
