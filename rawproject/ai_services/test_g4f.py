import g4f

text = "If the carrier fails to carry any goods to the destination within the specified time due to a disaster or accident in the course of carriage of the goods and such goods are perishable or their price or quality is susceptible to decrease significantly, the carrier may sell such goods even without the consent of the owner. (2) The carrier shall pay the amount so obtained from the sale made pursuant to sub-section (1) to the owner."

prompt = f"Simplify the following legal text in plain English. Reply only with the simplification, no intro:\n\n{text}"

try:
    response = g4f.ChatCompletion.create(
        model=g4f.models.gpt_4o_mini,
        messages=[{"role": "user", "content": prompt}],
    )
    print("Response:", response)
except Exception as e:
    print("Error:", e)
