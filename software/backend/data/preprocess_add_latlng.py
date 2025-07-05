import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
import time
import os

# --- Configuration ---
INPUT_EXCEL_FILE = 'wrc_download_20240522.xlsx'
OUTPUT_EXCEL_FILE = 'wrc_download_20240522_geocoded_target_counties.xlsx' # Updated output name
COMMUNITIES_SHEET_NAME = 'Communities' # The sheet containing community data

# --- COLUMNS IN YOUR 'Communities' SHEET (VERIFY THESE EXACTLY) ---
# This column should contain the full name used for geocoding (e.g., "Austin, TX")
COMMUNITY_SHEET_NAME_COL_FOR_GEOCODING = 'NAME'

# This column should contain the simple county name (e.g., "Travis", "Los Angeles")
# This is used to filter *which* communities to geocode.
COMMUNITY_SHEET_SIMPLE_COUNTY_NAME_COL = 'COUNTYNAME' # <--- MAKE SURE THIS IS THE CORRECT COLUMN NAME IN YOUR 'Communities' SHEET

# This column should contain the state abbreviation (e.g., "TX", "CA")
# This is used with COMMUNITY_SHEET_SIMPLE_COUNTY_NAME_COL to filter.
COMMUNITY_SHEET_STATE_ABBR_COL = 'STUSPS' # <--- MAKE SURE THIS IS THE CORRECT COLUMN NAME

# --- TARGET COUNTIES: Provide simple county name and its state abbreviation ---
# The script will only attempt to geocode communities that belong to these counties.
TARGET_COUNTIES_TO_PROCESS = [
    {"county_simple_name": "Travis", "state_abbr": "TX"},
    {"county_simple_name": "Los Angeles", "state_abbr": "CA"},
    # Add more {"county_simple_name": "SomeOtherCounty", "state_abbr": "YY"} if needed
]

# Initialize geolocator
geolocator = Nominatim(user_agent="firellm_community_geocoder_v2", timeout=10) # Updated user agent

# --- Helper Function for Geocoding with Retries ---
def geocode_address(address, attempt=1, max_attempts=3):
    if not address or pd.isna(address):
        print(f"  Skipping geocoding for empty or NaN address: {address}")
        return None, None
    try:
        # print(f"  Geocoding: '{address}' (Attempt {attempt})") # Uncomment for verbose logging
        location = geolocator.geocode(address, timeout=7) # Shorter timeout for individual attempts
        time.sleep(1.1)  # Respect Nominatim's usage policy (1 request per second)
        if location:
            # print(f"  Found: {location.address} -> ({location.latitude}, {location.longitude})")
            return location.latitude, location.longitude
        else:
            print(f"  Warning: Could not geocode '{address}'. Location not found by Nominatim.")
            return None, None
    except GeocoderTimedOut:
        print(f"  Warning: GeocoderTimedOut for '{address}' on attempt {attempt}.")
        if attempt < max_attempts:
            time.sleep((2 ** attempt) + random.uniform(0,1)) # Exponential backoff with jitter
            return geocode_address(address, attempt + 1, max_attempts)
        else:
            print(f"  Error: GeocoderTimedOut persisted after {max_attempts} attempts for '{address}'.")
            return None, None
    except GeocoderUnavailable:
        print(f"  Warning: GeocoderUnavailable for '{address}' on attempt {attempt}. Service might be down.")
        if attempt < max_attempts:
            time.sleep(5 * attempt + random.uniform(0,1)) # Longer backoff for service unavailability
            return geocode_address(address, attempt + 1, max_attempts)
        else:
            print(f"  Error: GeocoderUnavailable persisted after {max_attempts} attempts for '{address}'.")
            return None, None
    except Exception as e:
        print(f"  Error geocoding '{address}': {e}")
        return None, None

import random # For jitter in backoff

def run_county_focused_geocoding(input_path, output_path):
    print(f"Loading Excel file: {input_path}")
    try:
        xls = pd.ExcelFile(input_path)
    except FileNotFoundError:
        print(f"ERROR: Input file not found at '{input_path}'. Please ensure it's in the same directory or provide the full path.")
        return
    except Exception as e:
        print(f"ERROR: Could not load Excel file '{input_path}': {e}")
        return

    sheet_names = xls.sheet_names
    if COMMUNITIES_SHEET_NAME not in sheet_names:
        print(f"ERROR: Sheet '{COMMUNITIES_SHEET_NAME}' not found in the Excel file. Available sheets: {sheet_names}")
        return

    print(f"Reading sheet: '{COMMUNITIES_SHEET_NAME}'")
    df_communities_orig = xls.parse(COMMUNITIES_SHEET_NAME)
    df_communities = df_communities_orig.copy() # Work on a copy to preserve original data in memory

    # --- Verify required columns exist in the Communities sheet ---
    required_cols_in_communities_for_filtering_and_geocoding = list(set([ # Use set to avoid duplicates
        COMMUNITY_SHEET_NAME_COL_FOR_GEOCODING,
        COMMUNITY_SHEET_SIMPLE_COUNTY_NAME_COL,
        COMMUNITY_SHEET_STATE_ABBR_COL
    ]))
    
    missing_cols = [col for col in required_cols_in_communities_for_filtering_and_geocoding if col not in df_communities.columns]
    if missing_cols:
        print(f"ERROR: Missing one or more critical columns in sheet '{COMMUNITIES_SHEET_NAME}': {missing_cols}")
        print(f"       Available columns are: {df_communities.columns.tolist()}")
        print(f"       Please ensure the constants COMMUNITY_SHEET_NAME_COL_FOR_GEOCODING ('{COMMUNITY_SHEET_NAME_COL_FOR_GEOCODING}'), ")
        print(f"       COMMUNITY_SHEET_SIMPLE_COUNTY_NAME_COL ('{COMMUNITY_SHEET_SIMPLE_COUNTY_NAME_COL}'), ")
        print(f"       and COMMUNITY_SHEET_STATE_ABBR_COL ('{COMMUNITY_SHEET_STATE_ABBR_COL}') are correctly set to existing column names.")
        return

    # --- Prepare LATITUDE/LONGITUDE columns ---
    # Add them if they don't exist, or convert existing ones to numeric (handling errors)
    if 'LATITUDE' not in df_communities.columns:
        df_communities['LATITUDE'] = np.nan # Use np.nan for proper NaN handling
    else:
        df_communities['LATITUDE'] = pd.to_numeric(df_communities['LATITUDE'], errors='coerce')

    if 'LONGITUDE' not in df_communities.columns:
        df_communities['LONGITUDE'] = np.nan
    else:
        df_communities['LONGITUDE'] = pd.to_numeric(df_communities['LONGITUDE'], errors='coerce')

    print("\n--- Filtering and Geocoding Communities in Target Counties ---")
    
    # Collect all indices from target counties that need geocoding
    indices_to_geocode_in_target_counties = []

    for target in TARGET_COUNTIES_TO_PROCESS:
        target_county_simple = target["county_simple_name"].strip().lower()
        target_state_abbr = target["state_abbr"].strip().upper()

        print(f"\nProcessing for County: '{target_county_simple.title()}', State: '{target_state_abbr}'")

        # Create a mask to filter communities belonging to the current target county and state
        # Ensure case-insensitivity and strip whitespace for robust matching
        mask = (
            df_communities[COMMUNITY_SHEET_SIMPLE_COUNTY_NAME_COL].astype(str).str.strip().str.lower() == target_county_simple
        ) & (
            df_communities[COMMUNITY_SHEET_STATE_ABBR_COL].astype(str).str.strip().str.upper() == target_state_abbr
        )
        
        # Get the DataFrame indices of the matching communities
        target_county_community_indices = df_communities[mask].index
        
        if not target_county_community_indices.empty:
            print(f"  Found {len(target_county_community_indices)} communities in '{target_county_simple.title()}, {target_state_abbr}'.")
            # Add these indices to the list of communities to potentially geocode
            indices_to_geocode_in_target_counties.extend(target_county_community_indices)
        else:
            print(f"  Warning: No communities found for '{target_county_simple.title()}, {target_state_abbr}'.")
            print(f"           (Searched for county='{target_county_simple}' in column '{COMMUNITY_SHEET_SIMPLE_COUNTY_NAME_COL}'")
            print(f"            and state='{target_state_abbr}' in column '{COMMUNITY_SHEET_STATE_ABBR_COL}')")

    # Get unique indices to avoid geocoding the same community multiple times if it somehow matched >1 target
    unique_indices_to_geocode = sorted(list(set(indices_to_geocode_in_target_counties)))
    total_to_geocode_initially = len(unique_indices_to_geocode)
    
    if total_to_geocode_initially == 0:
        print("\nNo communities found in any of the target counties based on the filter criteria.")
    else:
        print(f"\nIdentified {total_to_geocode_initially} unique communities from target counties to check for geocoding.")

    geocoded_in_this_run_count = 0
    actually_geocoded_newly = 0
    
    # Filter these unique_indices to only those that *actually* need geocoding (missing lat/lng)
    final_indices_needing_geocoding = [
        idx for idx in unique_indices_to_geocode 
        if pd.isna(df_communities.loc[idx, 'LATITUDE']) or pd.isna(df_communities.loc[idx, 'LONGITUDE'])
    ]
    total_actually_needing_geocoding = len(final_indices_needing_geocoding)

    print(f"Out of these, {total_actually_needing_geocoding} communities require new geocoding (missing LATITUDE or LONGITUDE).")

    if total_actually_needing_geocoding > 0:
        for i, index in enumerate(final_indices_needing_geocoding):
            # Geocode using the 'NAME' column (e.g., "Austin, TX") from the Communities sheet
            community_name_for_api_call = df_communities.loc[index, COMMUNITY_SHEET_NAME_COL_FOR_GEOCODING]
            
            print(f"  ({i+1}/{total_actually_needing_geocoding}) Geocoding: '{community_name_for_api_call}'")
            lat, lng = geocode_address(community_name_for_api_call)
            
            if lat is not None and lng is not None:
                df_communities.loc[index, 'LATITUDE'] = float(lat)
                df_communities.loc[index, 'LONGITUDE'] = float(lng)
                actually_geocoded_newly += 1
            geocoded_in_this_run_count += 1 # Counts attempts, not just successes
        print(f"\nFinished geocoding attempts. Newly geocoded/updated coordinates for {actually_geocoded_newly} communities within the target counties.")
    else:
        print("\nNo communities in the target counties required new geocoding (all already have LATITUDE/LONGITUDE).")


    # --- Save all sheets to the new Excel file ---
    # This ensures other sheets like 'States', 'Counties' are preserved
    print(f"\nSaving updated data to: {output_path}")
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        # Save the (potentially modified) Communities sheet
        df_communities.to_excel(writer, sheet_name=COMMUNITIES_SHEET_NAME, index=False)
        print(f"  Sheet '{COMMUNITIES_SHEET_NAME}' saved.")
        
        # Copy all other original sheets from the input Excel file
        for sheet_name in sheet_names:
            if sheet_name != COMMUNITIES_SHEET_NAME:
                print(f"  Copying original sheet: '{sheet_name}'")
                df_sheet_original = xls.parse(sheet_name) # Read original sheet again
                df_sheet_original.to_excel(writer, sheet_name=sheet_name, index=False)
        
    print(f"\nPreprocessing and targeted geocoding complete. Output saved to: {output_path}")

if __name__ == "__main__":
    if not os.path.exists(INPUT_EXCEL_FILE):
        print(f"ERROR: Input file '{INPUT_EXCEL_FILE}' not found in the current directory: {os.getcwd()}")
        print("       Please make sure the Excel file is present or provide the full path.")
    else:
        run_county_focused_geocoding(INPUT_EXCEL_FILE, OUTPUT_EXCEL_FILE)