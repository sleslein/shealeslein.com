---
title: How to Kill a Process Listening on a Port
description: A simple function for killing processes listening to a specific port.
date: 2020-04-22
tags:
  - programming
# layout: ../../layouts/BaseLayout.astro
---

As a front-end web developer I'm constantly starting and stopping my local webpack dev server. Starting the server is as easy as `yarn start`. Node starts up, and I'm off to the races. Stopping is easy too, `ctrl + c`. Well, stopping is easy so long as I have the terminal I started the process available. When I don't, I need to find the process that is listening to the port and close it.

What's a developer to do? Head to [Duck Duck Go](https://duckduckgo.com/) and search for "find a process listening to port on mac". Well, this has happened several times over the last couple of weeks. Each time I went to [the same article](https://tips.tutorialhorizon.com/2017/08/30/find-the-process-running-on-a-port-on-your-mac/) which gave me the following command:

`lsof -n -i4TCP:8080 | grep LISTEN | awk '{print $2}' | xargs kill -9`

Easy peasy! Update my port number. Press enter. The process is terminated and I'm back in business.

This works great! However, I have some problems with this. I'm lazy. I cannot remember this whole command. Honestly, I don't want to either. So, I added the following function to my `.zshrc` file.

```
# kill_port_proc <port>
function kill_port_proc {
    readonly PORT=${1:?"The port must be specified."}
    PID=$(lsof -i tcp:"$PORT" | grep LISTEN | awk '{print $2}')

    if [ ! -z $PID ]
    then
      # if the PID exists, kill it
      kill -9 ${PID}
      echo "Killed ${PID}"
    else
      # if it does not, displa this message
      echo "Nothing listening to port ${PORT}"
    fi
}
```

This function performs the same commands recommend in the article. It even tells me if no process exists. Now the next time I see the dreaded `Error: listen EADDRINUSE: address already in use 0.0.0.0:5555` message in my terminal because an old node process is already running, I don't need to search the web. I can simply run this command, `kill_port_proc 5555`
