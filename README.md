![](BW.png =250x250)

# On-D-Go (Messenger Bot)

On-D-Go is Messenger Bot which aims to track your daily whereabouts such as if you want to reach your office by 9am ,  you can ask the bot to inform you about the traffic details on the go before you leave home.

## WHAT THE USER NEEDS TO DO:

1. Open Messenger text the Bot "Hey!"
2. Bot responds with a message so as to what the user needs to keep track about.
3. User inputs - "i need to reach office by 9 am"
4. Bot asks for the necessary information such as his HOME address , OFFICE address
5. Using Google maps API we calculate the time between the two locations considering the traffic at that moment
6. Thus informing the user beforehand about the traffic conditions by a notif so he/she leaves early and reaches the destination on time.
7. Also if traffic is very bad, our bot shall suggest alternate ways to commute such as metro/bus
8. The user can also save his office, home address for quicker use next time which gets stored in the db


We also plan to integrate flight, train and bus information, if user inputs PNR number he/shes shall get all the information about their train and shall be informed beforehand about the running status of the train and suggest the user a time when he/she must leave to reach the station.
