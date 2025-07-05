import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


input_path = '/Users/kinjalsingh/Downloads/us_140esp.csv'  
output_path = '/Users/kinjalsingh/Downloads/processedesp_vegetation.csv'


df = pd.read_csv(input_path)


df = df[df['VALUE'] != -9999]


columns_to_keep = ['VALUE', 'ZONE_NAME', 'ESP_Name', 'ESP_LF', 'ESPLF_Name']
df = df[columns_to_keep]


df['ZONE_NAME_ENC'] = df['ZONE_NAME'].astype('category').cat.codes
df['ESP_Name_ENC'] = df['ESP_Name'].astype('category').cat.codes
df['ESPLF_Name_ENC'] = df['ESPLF_Name'].astype('category').cat.codes


df.to_csv(output_path, index=False)

pivot = pd.crosstab(df['ZONE_NAME'], df['ESPLF_Name'])

plt.figure(figsize=(14,10))
sns.heatmap(pivot, cmap="YlGnBu", linewidths=0.2)
plt.title("Heatmap of Vegetation Types Across Zones")
plt.xlabel("Vegetation Type")
plt.ylabel("Zone Name")
plt.tight_layout()
plt.show()

print(f"Processed vegetation data saved to {output_path}")
