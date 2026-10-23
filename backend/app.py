import pandas as pd
import numpy as np
import random

# Set seed for reproducibility during the hackathon
np.random.seed(42)
random.seed(42)

NUM_ROWS = 500

# Lagos-specific constraints based on the 2026 Budget of Shared Prosperity
mdas = [
    "Ministry of Works and Infrastructure", "Ministry of Education", 
    "Ministry of Health", "Ministry of Environment and Water Resources", 
    "Lagos State Public Works Corporation (LSPWC)", "Ministry of Transportation",
    "Office of Civic Engagement", "Lagos State Sports Commission"
]

sectors = ["Economic", "Social", "Administration", "Law & Justice"]

expenditure_types = ["Capital", "Recurrent - Personnel", "Recurrent - Overhead"]

lgas = [
    "Alimosho", "Ajeromi-Ifelodun", "Kosofe", "Mushin", "Oshodi-Isolo", 
    "Ojo", "Ikorodu", "Surulere", "Agege", "Ifako-Ijaiye", "Somolu", 
    "Amuwo-Odofin", "Lagos Mainland", "Ikeja", "Eti-Osa", "Badagry", 
    "Apapa", "Lagos Island", "Epe", "Ibeju-Lekki"
]

# Realistic project templates
capital_projects = [
    "Construction of {lga} Regional Road",
    "Rehabilitation of General Hospital in {lga}",
    "Desilting and Drainage clearing in {lga}",
    "Construction of BRT Corridor passing through {lga}",
    "Building of 12-block classroom at {lga} High School",
    "Installation of Solar Street Lights in {lga}",
    "Transformation of {lga} Underbridge and Park"
]

recurrent_projects = [
    "Payment of Teachers' Salaries for Q1-Q4 in {lga}",
    "Operational fueling for LAWMA trucks in {lga}",
    "Routine maintenance of Primary Health Centers in {lga}",
    "Administrative overhead and stationery for {lga} local offices"
]

data = []

for _ in range(NUM_ROWS):
    mda = random.choice(mdas)
    lga = random.choice(lgas)
    
    # Assign sector and expenditure type logically
    if "Works" in mda or "Transportation" in mda or "Environment" in mda:
        sector = "Economic"
        exp_type = np.random.choice(expenditure_types, p=[0.7, 0.1, 0.2])
    elif "Health" in mda or "Education" in mda:
        sector = "Social"
        exp_type = np.random.choice(expenditure_types, p=[0.4, 0.4, 0.2])
    else:
        sector = random.choice(["Administration", "Law & Justice", "Social"])
        exp_type = np.random.choice(expenditure_types, p=[0.2, 0.5, 0.3])
        
    # Generate realistic project description
    if exp_type == "Capital":
        desc = random.choice(capital_projects).format(lga=lga)
        # Capital projects are expensive: 50M to 15 Billion Naira
        approved = np.random.uniform(50_000_000, 15_000_000_000)
    else:
        desc = random.choice(recurrent_projects).format(lga=lga)
        # Recurrent costs are usually lower per line item: 10M to 2 Billion Naira
        approved = np.random.uniform(10_000_000, 2_000_000_000)
        
    # Simulate execution rates (The "Accountability" factor)
    # Some projects are 100% funded, some are stalled at 10-30%
    execution_rate = np.random.choice(
        [1.0, 0.8, 0.5, 0.2, 0.0], 
        p=[0.3, 0.3, 0.2, 0.15, 0.05]
    )
    actual = approved * execution_rate
    
    data.append({
        "fiscal_year": 2026,
        "mda": mda,
        "sector": sector,
        "expenditure_type": exp_type,
        "project_description": desc,
        "lga": lga,
        "approved_budget_naira": round(approved, 2),
        "actual_disbursed_naira": round(actual, 2)
    })

# Create DataFrame and save to CSV
df = pd.DataFrame(data)
df.to_csv("lagos_budget_2026.csv", index=False)
print("✅ Successfully generated lagos_budget_2026.csv with 500 rows!")