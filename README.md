# Room of Thought Legacy
## What is Room of Thought
Room of Thought (RoT) is a solo developed tabletop simulator. I started development of this version of the program in early 2020. With the pandemic fast approaching me and my friends wanted a way to continue playing our D&D campaigns. However existing tabletop programs were either too expensive for us or too clunky for our less tech-savvy players. So the main design goals became the following:

 - Ease of access: Once set up the DM can simply send a link to their players and it just works, completely platform independent. No installing applications on every players PC.
 - Ease of use: New players should be able to use the program with minimal explanation.

In the end I went through 60 different releases over a 3.5 year period and each of them is presented in the commits here.
Note: Do not see this code as an indication of my current skill level. I have learned much during the development of this project and realize I made many (and I mean MANY) mistakes. Especially early on I was only trying to get something working ASAP, but seeing as this is my largest project, I wanted to show everything unchanged and unedited. Not only as a proof of work but also as a time capsule for myself.

## Side projects
Below is a list of all the side projects I did that were somehow related to RoT.
### D&D Viewer
This was a precursor to RoT which I made in highschool. It is written in AutoIt (a language I was more comfortable with at the time).
### RoT Manager
This was going to be a seperate page in RoT which would allow users to upload tokens and maps remotely. That way the DMs who were not able to port-forward their local instance of the server would be able to configure RoT running on some other persons network. In the end we managed to find a different solution making this function irrelevant.
### Dynamic lighting (blocking)
This was a joke feature I added to RoT. It adds the features for DMs to describe the walls of a map and then a view-radius for each (player)token, when a token then moves their view range is immediately updated so there is no need for (de)activating blockers on the map to show new areas. It turned out to be kind of impractical as players could move where ever they wanted easily which could also ruin surprises. It was never used much after I added it (for obvious reasons).
### RoT Mobile
I added a separate page in RoT which players can access from their phone/tablet which only displays the initiative tracker. This is used to update the stats of tokens (such as HP and Initiative). During Covid in the time when the Dutch government only allowed a specific amount of guests per day (generally 2 at a time) this proved very useful. At that time we would rotate, having a few players at the table and a few online. We set up cameras and laptops to fully track & display the current state of the game in RoT but this also required the physical players to update their character stats regularly otherwise the online players would not be fully part of the game. After this period though the mobile page was not used much anymore.
### RoT Portal
This was a physical board I made which could detect the placement of minis and would change the positions of the associated tokens in RoT automatically when you moved a mini. The board turned out to be kind of impractical as it was relatively small and it was hard to draw the rooms on it.
The board worked by having two electrodes on each square. Minis with magnets on their base would then bridge the connection and an Arduino connected to the electrodes would detect it. This information then gets sent over USB to a laptop running the portal python script which was connected to RoT.
The script works out most of the details, like which token is associated with which mini based on the square it previously occupied so that if a mini gets picked up it knows where to move the token.
On the server side the current state of each portal would be saved so any client could associate with any board allowing multiple boards to be used with RoT at the same time. So each player could have a physical board in front of them and then RoT would tell them when the minis on the board infront of them desync with the tokens in the program indicating that the user should move the minis to the new position.
In general this system was far from perfect and had a lot of caveats but was usable and interesting to build.