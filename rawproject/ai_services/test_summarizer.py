from transformers import pipeline
print("Loading model...")
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
text = "If the carrier fails to carry any goods to the destination within the specified time due to a disaster or accident in the course of carriage of the goods and such goods are perishable or their price or quality is susceptible to decrease significantly, the carrier may sell such goods even without the consent of the owner. (2) The carrier shall pay the amount so obtained from the sale made pursuant to sub-section (1) to the owner."
print("Summarizing...")
summary = summarizer(text, max_length=50, min_length=10, do_sample=False)
print("Summary:", summary)
