---
title: Creating a git alias to trigger a rebuild
description: See how to create git aliases can improve your productivity.
date: 2022-02-15
tags:
  - programming
# layout: ../../layouts/BaseLayout.astro
---

Confession time. For quite a while I've been making meaningless manual changes in my PR's during when CI processes fail due to test flake. Recently, however, a new member of the team enlightened me. You can create empty commits in git by adding the `--allow-empty` flag to commit. This is certainly a huge productivity benefit. This week the test flake has gotten real, but I don't have time to deal with that. Manually typing out a commit and push is feeling like such a burden.

```sh
> git commit --allow-empty -m "trigger rebuild"
> git push
```

So much work! Thankfully, today I learned about git aliases and now I can simply run `git rebuild`. Much better! Here's how to do it.

First, open the `.gitconfig` file with your favorite text editor. Most likely this is in your home directory. If you're using macOS, open Finder and navigate to the `Users/[yourUserName]` directory. The file may be hidden. If you don't see it then press `shift + cmd + .`.

After the file is open in your text editor add an alias section and your command and save the file. The result should look like this:

```
[alias]
  rebuild = !git commit --allow-empty -m 'trigger rebuild' && git push
```

Try it out! You can open your terminal, and run a simple `git rebuild` command to create and push your empty commit.

This opens up a whole world of new possibilities to explore! It's easy to envision many ways to create new simple shortcuts. Even small thing small like creating a shortcut checkout a branch with a `git co` command instead of `git checkout` offers some nice developer experience improvements.
