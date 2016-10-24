function parse(url, index, array) {
    try {
    var cheerio=require("cheerio");
    var req=require("sync-request");
    var html = req('GET', url).getBody().toString();
    var $ = cheerio.load(html, {xmlMode: true});
    logger.info("start processing " + url);
    console.log("start processing " + url);
    var num = 0;
    $("item").each(function(i,elem) {
      num++;
      var description = $(this).children("description").text();
      var link = $(this).children("link").text();
      if(index==1 || index==4) {
        var temp = description.split("<div class=");
        description = temp[0];
      }
      
      if(index == 3 || index == 4) {
         link = getVideoLink($(this).children("link").text(), index);
      }else if(index==2){
         var temp = [];
         temp = link.split("=");
         
         link = temp[1];
    
      }
      
      if(index == 1) {
        name = "CNN";
      }else if(index==2){
        name = "CNBC";
      }else if(index==3){
        name = "abc";
      }else if(index==4){
        name = "Reuters" 
      }
     
      array.push({"title":$(this).children("title").text(), 
                  "publishedDate":$(this).children("pubDate").text(),
                  "description":description,
                  "link":link,
                  "podcastTitle": $("channel").children("title").text(),
                  "podcastDesc": $("channel").children("description").text(),
                  "image": $("channel").children("image").children("url").text(),
                  "index": index,
                  "from": name
      });
   });
    } catch(err){
        logger.error(err);
    }
}

function getVideoLink(url, index) {
    var link;
    try {
        var cheerio=require("cheerio");
        var req=require("sync-request");
        var html = req('GET', url).getBody().toString();
        var $ = cheerio.load(html, {xmlMode: true});
        logger.info("start to getVideoLink..., index: " + index + ", " + url);
        if(index==3) {
            $("#video_stage").find("meta").each(function(i,elem) {
              if($(this).attr("itemprop")=="contentUrl") {
                  link = $(this).attr("content")
              }
            });
        }else if(index==4) {
            link = $("iframe.reuters-vidembed").attr("src");
        }
        logger.info("end getVideoLink..., url: " + link);
        return link;
    } catch(err) {
        logger.error(err);
        return link;
    }
}

function start() {
    
    logger.info("<-- before accept request from clients, it must pre-process -->")
    for(var index=1;index<=4;index++) {
      
      var url;
      
      if(index==1) {  
        url = "http://rss.cnn.com/services/podcasting/studentnews/rss.xml";
      }else if(index==2) {
        url = "http://www.cnbc.com/id/15839263/device/rss/rss.html";
      }else if(index==3) {
        url = "http://feeds.abcnews.com/abcnews/mostviewedvideos";
      }else if(index==4) { 
        url="http://www.reuters.com/tools/rss";
      }
      
        if(index==4) {
          var num = 0;
          var cheerio=require("cheerio");
          var req=require("sync-request");
          var html = req('GET', url).getBody().toString();
          var $ = cheerio.load(html, {xmlMode: true});
          $("h3").each(function(i,elem) {
            if($(this).text() == "Video") {
              $(this).parent().parent().find("td.feedUrl").each(function(i,elem){
                num++;
                //console.log(num);
                //if(num <= 1){
                  url=$(this).text();
                  parse(url, index, array);
                //}
              });
            }
          });
        }else{
            parse(url, index, array);
        }
    }
}

var log4js=require('log4js');

log4js.configure({
  appenders: [
    { type: 'file', filename: 'logs/parse.log'}
  ]
});
log4js.loadAppender('file');
var logger=log4js.getLogger();
console.log("The service is starting...");
logger.info("The service is starting...");

var http=require('http');
var express=require('express');
var app=express();
var server=http.createServer(app);
var array = [];

app.get('/', function(request, response){
    logger.info("Request received.");
    try {
        response.writeHead(200, {"Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"});
        
        var json;
        var otherObject;

        otherObject={"feed":{"entries":array}};
            json=JSON.stringify({
              responseData: otherObject
            });
        response.end(json);
    } catch(err) {
        logger.error(err);
        response.end();
    }
});


start();

server.listen(5566,'127.0.0.1',function(){
  logger.debug('Server has started.');
  console.log('Server has started.');
});

