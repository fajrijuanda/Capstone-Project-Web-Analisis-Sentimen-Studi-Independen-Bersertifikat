import logging
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from django.utils import timezone
from apps.dashboards.models import CommentData, TwitterData
from apps.comment.models import Result
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import re
import torch
import subprocess
import os
import shutil

# Configure logging
logger = logging.getLogger(__name__)

os.environ["PATH"] += os.pathsep + r"C:\Program Files\nodejs"
if not shutil.which("node"):
    raise FileNotFoundError(
        "Node.js not found. Please ensure Node.js is installed and added to PATH."
    )
if not shutil.which("npx"):
    raise FileNotFoundError(
        "npx not found. Please ensure Node.js and npx are installed and added to PATH."
    )

logger = logging.getLogger(__name__)

# Ensure Node.js and npx exist in PATH
os.environ["PATH"] += os.pathsep + r"C:\Program Files\nodejs"
if not shutil.which("node"):
    raise FileNotFoundError(
        "Node.js not found. Please ensure Node.js is installed and added to PATH."
    )
if not shutil.which("npx"):
    raise FileNotFoundError(
        "npx not found. Please ensure Node.js and npx are installed and added to PATH."
    )


def generate_filename(username):
    """
    Generate unique filename based on username and numbering in correct directory.
    """
    counter = 1
    while True:
        filename = os.path.join(f"{username}_tweets_{counter}.csv")
        if not os.path.exists(filename):
            return filename  # Return the first available filename
        counter += 1


def fetch_twitter_data(
    auth_token, query, date_from, date_until, limit=200, username="user"
):
    """
    Fetch tweets using tweet-harvest and save with unique filename in correct directory.
    """
    try:
        # Ensure output directory exists correctly (only one level 'tweets-data')
        base_output_dir = "tweets-data"
        os.makedirs(base_output_dir, exist_ok=True)

        # Generate unique file name
        output_file = generate_filename(username)

        # Format query string
        search_query = f'"{query} since:{date_from} until:{date_until} lang:id"'

        # Command with formatted query
        command = 'npx -y tweet-harvest@2.6.1 -o "{}" -s {} --tab LATEST -l {} --token {}'.format(
            output_file, search_query, limit, auth_token
        )

        logger.info(f"Running command: {command}")

        # Run the command and capture output
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )

        # Check if no tweets were saved
        if "Total tweets saved: 0" in result.stdout:
            logger.warning("No tweets found, stopping process.")
            return None

        output_file = base_output_dir + "/" + output_file
        # Verify file exists
        if os.path.exists(output_file):
            logger.info(f"Fetched tweets successfully. File: {output_file}")
            return output_file  # Return correct file path
        else:
            logger.error("Output file not found after running tweet-harvest.")
            return None

    except subprocess.CalledProcessError as e:
        logger.error(f"Error while running tweet-harvest: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in fetch_twitter_data: {e}")
        return None


def preprocess_text(text):
    """
    Clean and preprocess text before sentiment analysis.
    - Remove URLs
    - Remove usernames (@username)
    - Remove hashtags (#hashtag)
    - Remove emojis
    - Remove redundant spaces
    """
    # Remove URLs
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)

    # Remove mentions and hashtags (preserve the words without symbols)
    text = re.sub(r"@\w+", "", text)  # Remove mentions
    text = re.sub(r"#", "", text)  # Remove the hashtag symbol only, keep the word

    # Remove emojis and non-ASCII characters
    text = re.sub(r"[^\x00-\x7F]+", " ", text)

    # Remove unnecessary punctuations but preserve words
    text = re.sub(r"[^\w\s]", "", text)

    # Normalize whitespace
    text = " ".join(text.split())

    # Convert to lowercase
    return text.lower()


def perform_sentiment_analysis(text):
    """
    Perform sentiment analysis on the provided text and extract keywords.
    """
    try:
        if not text or len(text.strip()) < 3:
            return {"positive": 0.0, "neutral": 0.0, "negative": 0.0}, {}

        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(
            "w11wo/indonesian-roberta-base-sentiment-classifier"
        )
        model = AutoModelForSequenceClassification.from_pretrained(
            "w11wo/indonesian-roberta-base-sentiment-classifier"
        )

        # Tokenize input text
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
        outputs = model(**inputs)

        # Extract sentiment scores
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1).detach().numpy()[0]

        id2label = model.config.id2label
        sentiment_scores = {
            id2label[i]: probabilities[i] * 100 for i in range(len(probabilities))
        }

        # Determine dominant sentiment
        sorted_scores = sorted(
            sentiment_scores.items(), key=lambda x: x[1], reverse=True
        )
        dominant_sentiment = sorted_scores[0][0]

        # Log scores
        logger.info(f"Sentiment scores: {sentiment_scores}")
        logger.info(f"Dominant sentiment: {dominant_sentiment}")

        return sentiment_scores, {"keywords": text.split()}

    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return {"positive": 0.0, "neutral": 0.0, "negative": 0.0}, {}


from django.utils.timezone import now
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def analyze_and_save_sentiment(data_instance, is_twitter=False, auth_token=None):
    try:
        if is_twitter:
            # Fetch Twitter data
            file_path = fetch_twitter_data(
                auth_token=auth_token,
                query=data_instance.topic,
                date_from=data_instance.date_from,
                date_until=data_instance.date_until,
                username=(data_instance.user.username if data_instance.user else "anonymous"),
            )

            if not file_path:
                logger.warning(f"No tweets found for topic: {data_instance.topic}")
                return {
                    "status": "warning",
                    "message": "No tweets found for the given query.",
                }

            # Load CSV for analysis
            df = pd.read_csv(file_path)

            if df.empty:
                logger.warning("The CSV file is empty, stopping analysis.")
                return {"status": "warning", "message": "The CSV file is empty."}

            # Process each row for sentiment analysis
            processed_tweets = 0
            for _, row in df.iterrows():
                tweet_text = row.get("full_text", "").strip()
                if not tweet_text or len(tweet_text) < 5:
                    continue

                # Preprocess the text
                cleaned_text = preprocess_text(tweet_text)

                # Perform sentiment analysis
                sentiment_results, keywords = perform_sentiment_analysis(cleaned_text)

                # Extract created_at from CSV or use current time
                created_at_raw = row.get("created_at", "")
                try:
                    created_at = datetime.strptime(created_at_raw, "%a %b %d %H:%M:%S %z %Y") if created_at_raw else now()
                except ValueError:
                    logger.warning(f"Invalid date format in created_at: {created_at_raw}, using current time.")
                    created_at = now()

                # Save the cleaned text to CommentData and Result
                comment_instance = CommentData.objects.create(
                    user=data_instance.user,
                    topic=data_instance.topic,
                    comment=cleaned_text,
                    twitter_data=data_instance,  # Simpan ID dari TwitterData
                    created_at=created_at,  # Waktu dari CSV atau default
                )

                Result.objects.create(
                    comment=comment_instance,
                    positive_percentage=sentiment_results["positive"],
                    neutral_percentage=sentiment_results["neutral"],
                    negative_percentage=sentiment_results["negative"],
                    keywords=keywords,
                )
                processed_tweets += 1

            logger.info(f"Processed {processed_tweets} tweets for topic: {data_instance.topic}.")
            return {
                "status": "success",
                "message": f"Processed {processed_tweets} tweets successfully.",
            }

        else:
            # Handle manual comment processing
            cleaned_text = preprocess_text(data_instance.comment)
            sentiment_results, keywords = perform_sentiment_analysis(cleaned_text)

            # Use current time for created_at in manual input
            comment_instance = CommentData.objects.create(
                user=data_instance.user,
                topic=data_instance.topic,
                comment=cleaned_text,
                created_at=now(),  # Waktu saat ini
            )

            Result.objects.create(
                comment=comment_instance,
                positive_percentage=sentiment_results["positive"],
                neutral_percentage=sentiment_results["neutral"],
                negative_percentage=sentiment_results["negative"],
                keywords=keywords,
            )

            return {
                "status": "success",
                "message": "Comment sentiment analyzed successfully.",
            }

    except Exception as e:
        logger.error(f"Error in analyze_and_save_sentiment: {e}")
        return {"status": "error", "message": str(e)}
