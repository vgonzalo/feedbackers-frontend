Feedbackers
===========

--------


Installation
------------


You might need to install gulp globally

```sh
    npm install -g gulp
```

Then install all development dependencies

```sh
    npm install
```

Finally, fire up the server

```
    gulp
```


Run in production mode
----------------------

```
    gulp prod
```


Publish to S3
-------------

First you need to create in the root directory a file called awsconfig.json and define the Access Key, the Access Secret Key and the bucket name with the following example:

```
{
  "AWS_KEY" : "AKIAJZ6WCT6RPN6UOOPAS",
  "AWS_SECRET" : "ahAu3BPD4213BdIx0e5lrZoVxDF1WALN/3ASDW",
  "BUCKET" : "feedbackers.evis.cl"
}
```

Then just run:


```
    gulp publish
```

--------------

