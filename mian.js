var fs = require('fs')
var path = require('path')
var request = require('request');

var url = process.argv[2].replace('/#/','/')
var minimumsize = 10

const getSongList = (url) => {
  request(url, (error, body) => {
    if (error) throw error;
    var res = /<ul class="f-hide">(.*?)<\/ul>/gi.exec(body.body)
    var playload = {}, res1, contents
    if (res) {
      res1 = res[1].replace(/<(?:.|\s)*?>/g, ",")
      contents = res1.split(',').filter((x) => x !== '')
      contents.map((value) => {
        playload = {'word': value, 'version': '2', 'from': '0'}
        getSongId(playload)
      })
    } else {
      console.log('Can not fetch information form URL. Please make sure the URL is right.\n')
    }
  })
}

const getSongId = (params) => {
  var url = 'http://sug.music.baidu.com/info/suggestion', contents, songid, data
  request.get(url, {qs: params}, (error, response, body) => {
    if (error) throw error;
    console.log('开始查找，查找关键词为:', params)
    contents = JSON.parse(body)
    if (!contents.data) {
      console.log('未找到此歌曲信息')
      return
    }
    songid = contents['data']['song'][0]['songid']
    data = {'songIds': songid, 'type': 'flac'}
    downloadSong(data)
  })
}

const downloadSong = async (params) => {
  var res = await new Promise((resolve, reject) => {
    var download_link = 'http://music.baidu.com/data/music/fmlink', contents, songsdir = "songs_dir",
    songname, artistname, filename, song = {}
    request.get(download_link, {qs: params}, (error, response, body) => {
      if (error) reject(error);
      contents = JSON.parse(body)
      songlink = contents['data']['songList'][0]['songLink']
      if (songlink.length < 10) {
        return
      }
      fs.stat(songsdir, (err, stats) => {
        if (stats && stats.isDirectory()) {
          return true
        } else {
          try {
            fs.mkdir(songsdir, (err) => {
              if (err) throw err;
            })
          } catch(err) {
            throw err
          }
        }
      })
      songname = contents["data"]["songList"][0]["songName"]
      artistname = contents["data"]["songList"][0]["artistName"]
      filename = path.resolve(__dirname, `./${songsdir}/${songname}-${artistname}.flac`)
      song = {songlink: songlink, songname: songname, filename: filename}
      resolve(song)
    })
  })
  var headers = await new Promise((resolve, reject) => {
    request.head(res.songlink, (error, body) => {
      if (error) reject(error);
      resolve(body)
    })
  })
  var size = (Number(headers.headers['content-length']) / Math.pow(1024, 2)).toFixed(2)
  var songfile = await new Promise((resolve, reject) => {
    fs.stat(res.filename, (err, stat) => {
      var search_list = []
      if(stat && stat.isFile()) {
        console.log(`${res.songname} is already download in songs_dir`)
      } else {
        if (size >= minimumsize) {
          request.get(res.songlink)
          .on('error', function(err) {
            console.log(err)
          })
          .pipe(fs.createWriteStream(res.filename))
          search_list.push(res.songname)
          console.log(`${search_list} 已经下载完成！`)
        } else {
          console.log(`${res.songname} is less than 10 Mb, skipping`)
        }
      }  
    })
  })
}

getSongList(url)