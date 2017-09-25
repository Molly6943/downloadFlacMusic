var fs = require('fs')
var path = require('path')
var request = require('request');

var test_url = 'http://music.163.com/#/playlist?id=88156914'
var minimumsize = 10

test_url = test_url.replace('/#/','/')
console.log(test_url)

const getSongList = (url) => {
  request(url, (error, body) => {
    if (error) throw error;
    var res = body.body.match(/<textarea style="display:none;">(.*?)<\/textarea>/)
    console.log(res)
    var contents, playload = {}
    if (res) {
      contents = JSON.parse(res[1])
      contents.map((value) => {
        var search_list = []
        search_list.push(value['name'])
        value['artists'].map((artist) => {
          search_list.push(artist['name'])
        })
        playload = {'word': search_list.join('+'), 'version': '2', 'from': '0'}
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
      fs.stat(songsdir, (err, stat) => {
        if (!stat.isDirectory()) {
          fs.mkdir(songsdir, (err) => {
            if (err) throw err;
          })
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
  var songfile = await new Promise((resolve, reject) => {
    request(res.songlink, (error, body) => {
      if (error) reject(error);
      resolve(body)
    })
  })
  var size = (Number(headers.headers['content-length']) / Math.pow(1024, 2)).toFixed(2)
  fs.stat(res.filename, (err, stat) => {
    if(stat && stat.isFile()) {
      console.log(`${res.songname} is already download in songs_dir`)
    } else {
      if (size >= minimumsize) {
        var out = fs.createWriteStream(res.filename)
        out.write(songfile)
        out.end()
      } else {
        console.log(1)
      }
    }  
  })
}

getSongList(test_url)