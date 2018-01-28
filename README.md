![](assets/logo.png)

# On-D-Go.ai [![](assets/fb.png)](https://www.facebook.com/OnDGoBot/)

On-D-Go.ai is Messenger Bot aims to provide complete information about your next train, thus helping you have a hassle free and a "happy journey".

___

### Basic queries the bot can address :

[Demo1](https://drive.google.com/open?id=1N4UvVcgc__35c_OIxGMW7IA5fXGwi_Yk)

- Start a conversation by sending Hey!

```sh
Hey
```

- Ask the about the live status of any train by just providing it the train number and the date of journey.

```sh
status 14511 27-01-2018
```

- Check the PNR Status 

```sh
pnr 2503704980
```

- List all the trains reaching a particular Station within a window of specified hours.

```sh
arriving ALD 3
```

---

### Simply save your PNR & let the bot handle everything :

[Demo2](https://drive.google.com/open?id=1Ma8tfUOU4tgESgdL-oy1--1rNT3N6FMD)

- Save your PNR number , bot saves it in its database and uses it to address user's further queries.

```sh
save pnr 2503704980
```

- Now you can check your ticket status, returns the pnr, train's name, train number, confirmation status of the seats of each passenger and the status of the chart if prepared or not.

```sh
my ticket status
```

- Also check your train's status, returns the current position of the train and informs the user if any delay + returns the station it is arriving at!

```sh
my train status
```

- While you're travelling user can check the time the train will reach the next station along with name of the next station.

```sh
my next station
```

- If by mistake you save a wrong pnr or want to edit your pnr number.

```sh
update pnr <new-pnr-number>
```

### Contributors

- [Pradeep Gangwar](https://github.com/pradeepgangwar)
- [A.S Gagan Ganapathy](https://github.com/CodHek)
- [Arindam Das Modak](https://github.com/Arindam-Modak)
- [Agam dwivedi](https://github.com/CaptainCod3)



