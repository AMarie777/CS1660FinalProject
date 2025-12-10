import boto3
import yfinance as yf
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses', region_name='us-east-2')

USER_TABLE = "UserGuesses1"
MODEL_TABLE = "NVDA_Predictions"

def lambda_handler(event, context):
    prediction_date = datetime.now().strftime("%Y-%m-%d")

    # 1️⃣ Fetch actual NVDA open price from yfinance
    date_obj = datetime.strptime(prediction_date, "%Y-%m-%d")
    next_date = date_obj + timedelta(days=1)

    data = yf.download(
        tickers="NVDA",
        start=prediction_date,
        end=next_date.strftime("%Y-%m-%d"),
        progress=False
    )

    if data.empty:
        raise Exception(f"No NVDA market data available for {prediction_date}")

    actual_open = float(data["Open"].iloc[0])

    # 2️⃣ Get model prediction
    model_table = dynamodb.Table(MODEL_TABLE)
    model_resp = model_table.get_item(Key={"PredictionDate": prediction_date})
    if "Item" not in model_resp:
        raise Exception(f"No model prediction found for {prediction_date}")
    model_pred = float(model_resp["Item"]["Predicted_Open_NVDA"])

    # 3️⃣ Scan all user guesses
    user_table = dynamodb.Table(USER_TABLE)
    scan = user_table.scan(ProjectionExpression="email, guess")

    if "Items" not in scan or len(scan["Items"]) == 0:
        return {"message": "No user guesses found"}

    # 4️⃣ Loop through users and send email
    for item in scan["Items"]:
        email = item["email"]
        user_guess = float(item["guess"])

        user_distance = abs(user_guess - actual_open)
        model_distance = abs(model_pred - actual_open)

        if user_distance < model_distance:
            result_msg = (
                f"You were closer!\n\n"
                f"Your guess: {user_guess}\n"
                f"Model prediction: {model_pred}\n"
                f"Actual NVDA Open: {actual_open}"
            )
        elif user_distance > model_distance:
            result_msg = (
                f"The model was closer.\n\n"
                f"Your guess: {user_guess}\n"
                f"Model prediction: {model_pred}\n"
                f"Actual NVDA Open: {actual_open}"
            )
        else:
            result_msg = (
                f"You and the model were equally close!\n\n"
                f"Your guess: {user_guess}\n"
                f"Model prediction: {model_pred}\n"
                f"Actual NVDA Open: {actual_open}"
            )

        # Send email
        ses.send_email(
            Source="beatthebot317@gmail.com",    # VERIFIED IN SES
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": "Your NVDA Prediction Results"},
                "Body": {"Text": {"Data": result_msg}}
            }
        )

    # 5️⃣ Delete all user guesses (so table only has new entries)
    with user_table.batch_writer() as batch:
        for item in scan['Items']:
            batch.delete_item(Key={"email": item['email']})

    return {"message": "Emails sent to all users", "num_users": len(scan["Items"])}
