# Melly Finder

A Node.js application that monitors and finds Melly (🍆👕) availability, sending notifications via Telegram when matches are found.

## Prerequisites

- Docker
- Docker Compose

## Installation

1. Clone the Repository:  
    `git clone git@github.com:ch0chi/melly-finder.git`
2. Create .env file  
    `cp .env.example .env`
3. Create a [telegram bot](https://gist.github.com/nafiesl/4ad622f344cd1dc3bb1ecbe468ff9f8a#create-a-telegram-bot-and-get-a-bot-token) and add the token to the .env file.
4. Create a new group in Telegram.
5. Add the bot to the new group.
6. *Optional* Disable the bot from joining new groups via botfather using `/setjoingroups`
7. Get the [chat id for the channel](https://gist.github.com/nafiesl/4ad622f344cd1dc3bb1ecbe468ff9f8a#get-chat-id-for-a-channel) and add the chat id to the .env file.
8. Update the fetch interval and month in the .env file to the desired values.

# Docker Compose Config
The current docker-compose file has the `network_mode` parameter set to proxy through a wireguard vpn. If you're using
a wireguard proxy container, you can keep this as it is. However, if you want to run the application withou a vpn proxy,
setting the value to `host` will work.


## Running the App
Start the application using docker compose:
`docker compose up -d`

## Environment Variables
| Variable             | Description                                        | Example                                     |
|----------------------|----------------------------------------------------|---------------------------------------------|
| `FETCH_INTERVAL`     | Data fetch interval (minutes)                      | `2`                                         |
| `TELEGRAM_BOT_TOKEN` | Bot authentication token                           | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_CHAT_ID`   | Chat ID from Step 7                                | `123456789`                                 |
| `MONTH`              | Processing month. Must be in the format of YYYY-MM | `2024-01`                                   |

## Usage
The bot includes an interactive CLI. Below are the commands it can take.

| Command                        | Description                                                                    |
|--------------------------------|--------------------------------------------------------------------------------|
| `/help`                        | Show this message                                                              |
| `/start`                       | Restart the bot                                                                |
| `/stop`                        | Stop the bot                                                                   |
| `/appointments`                | Check the available appointments                                               |
| `/stats`                       | Get the current scraper statistics                                             |
| `/changemonth [month YYYY-MM]` | Change the month to check for appointments. Example: `/changemonth 2025-09`    |
| `/changeinterval [minutes]`    | Change the interval to check for appointments. Example: `/changeinterval 5`    |
| `/checkdate [day YYYY-MM-DD]`  | Check if a specific date has appointments. Example: `/checkdate 2025-01-26`    |
| `/checkmonth [month YYYY-M]`   | Checks for both public and hidden appointments. Example: `/checkmonth 2025-09` |