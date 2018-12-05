# Karl

Karl is our custom Slack assistant. He knows a few tricks now but can learn how
to do many things. If you have ideas, talk to Tony (Karl’s teacher).

## What he can do

### Cheat Sheet

Track Attendance: `/attendance 67`
Show 30 day averages: /attendance`
Show X day averages: `/attendance stats X`

### Attendance Tracking

Karl can track your workout attendance. I know numbers are not everything but
they are one metric you could track if you’d like. To do this, simply type
`/attendance #`, where `#` is the number of people who attended the workout.
Make sure to type this in your city’s specific Slack Channel. Karl saves data
based on the channel so if you type it in a different channel, those numbers
will be lost from your data.

Karl will associate the number you type with the day you enter it. So Wednesday
after the workout, track your attendance then! If you forget and it’s Thursday,
entering that command will track it for Thursday which will be lost. More on
this later.

Karl will overwrite successive entries. If you enter `/attendance 142` but then
realize you actually only had 50 people show up, no problem! Enter, `/attendance
50` and Karl will overwrite the previous entry for that day.

Great! So now Karl is tracking data for you. How can you check it out? Simply
type `/attendance` and hit enter. Karl will give you your 30 day averages and a
fun chart. Want more?  Type `/attendance stats 60`, and Karl will give you your
last 60 day averages. You can replace `60` with any number.

#### Example

![Karl Tracking](https://github.com/tonyd256/karl/blob/master/images/karl-tracking.png)

![Karl Stats](https://github.com/tonyd256/karl/blob/master/images/karl-stats.png)

## Potential

This is the early beginnings of Karl. He's just a boy, but has so much
potential. Reach out to me with any ideas you have. If you find a bug or
something isn't working as expected, also contact me or post an issue here on
Github.

One potential idea (to get your juices flowing) is to allow a date to be passed
in when recording a stat. This way, you could still add numbers from previous
days. If this is something people end up wanting, I can add it.

# Contributing

If you'd like to contribute to Karl's capabilities, follow these instructions to
get Karl setup on your computer. These instructions are for people with Macs.
Sorry Windows and Linux folk!

## Setup

*Assuming a basic knowledge of programming and setting up a programming
environment on your laptop.*

First, clone the repo, `git clone git@github.com:tonyd256/karl.git`.

Before you install the dependencies, you'll need to install [Cairo] which is
needed for rendering the charts. At time of writing, this project uses version
1.16.0. Via Homebrew `brew install cairo`.

[Cairo]: https://www.cairographics.org

Now you can install the other dependencies, `yarn install` or `npm install`.

This project uses [PostgreSQL], so make sure that's running and create the
database by executing `createdb karl_db`.

[PostgreSQL]: https://www.postgresql.org/

To run the server, execute `yarn dev`. This will run the API and watch for file
changes so it can reload as you work.

## Interacting

Since this API is meant to interact with Slack, you'll have to imitate what
Slack is doing. You can use a program like [Postman] or [cURL] to make requests.
I recommend Postman because it will render the chart images which is super
useful.

[Postman]: https://www.getpostman.com/
[cURL]: https://curl.haxx.se/

When a person types the `/attendance` command into Slack, a POST request is sent
to `/slash` with body data like this:

```json
{
  "token": "sdkjfhsdkjfh",
  "command": "/attendance",
  "channel_id": "sf",
  "text": "stats 100",
  "user_id": "Tony"
}
```

Parsing the `command` and `text` is how most of the magic happens. Karl also
uses `channel_id` for storing data separate from other channels.

Karl can then respond according to the Slack message guidelines. To read more
about how slash commands work with Slack, check [this out].

[this out]: https://api.slack.com/slash-commands

# License

Karl is Copyright (c) 2018 Anthony DiPasquale. It is free software, and may be
redistributed under the terms specified in the [LICENSE](LICENSE) file.
