// ==UserScript==
// @name         Smugmug Album Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Smugmug Album Downloader
// @author       _John#1218
// @match        https://*.smugmug.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=smugmug.com
// @connect      https://photos.smugmug.com/
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @grant        GM_download
// @grant        GM_addStyle
// ==/UserScript==

/***************** IMPORTANT!!! ********************
For this script to work properly, do the following:

  1) Go to your Tampermonkey dashboard
  2) Click settings
  3) Change the 1st option (Config Mode) to "Advanced"
  4) Scroll down to "Downloads BETA"
  5) Change "Download Mode" to "Browser API"
  6) Save and exit, accept the new "Manage Download" 
     permission if prompted.

Doing this allows Tampermonkey to save the images to a 
folder in your default download location, rather than 
just spewing all the images out.
**************************************************/

$(document).ready(() => {
  $(`<button id="downloadAlb">Download Album</button>`).appendTo(
    ".sm-gallery-cover-title"
  );

  GM_addStyle(/*css*/ `
    .sm-gallery-cover-title {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    #downloadAlb {
      height: 40px;
      border-radius: 10px;
    }

    #downloadAlb:hover {
      background-color: gray;
    }

    #downloadProgress {
      position: fixed;
      z-index: 100;
      background: #adadad;
      width: fit-content;
      color: black;
      padding: 10px;
      font-weight: bold;
    }
  `);

  $("#downloadAlb").on("click", function (e) {
    let url = $("link[rel=alternate][type*=rss+xml]").attr("href");
    let regex = new RegExp(/\d*_[a-zA-Z\d]*/gm);

    let albumId = url.match(regex)[0].split("_")[0];
    let albumKey = url.match(regex)[0].split("_")[1];
    let links = [];

    const settings = {
      async: true,
      crossDomain: true,
      url: `https://creanlutheran.smugmug.com/services/api/json/1.4.0?galleryType=album&albumId=${albumId}&albumKey=${albumKey}&PageNumber=2&imageId=0&returnModelList=true&PageSize=5000&method=rpc.gallery.getalbum`,
      method: "GET",
    };

    $.ajax(settings).done(function (response) {
      console.log(response);

      if (
        !confirm(
          `You are about to download ${response.Pagination.TotalItems} images. Continue?`
        )
      )
        return;

      for (let image in response.Images) {
        let picID = response.Images[image].GalleryUrl.split("/").slice(-1)[0];

        let height = 0;
        let largestSize = "";
        let ext = "";

        // gets largest file of those available
        for (let size in response.Images[image].Sizes) {
          if (response.Images[image].Sizes[size].height > height) {
            height = response.Images[image].Sizes[size].height;
            largestSize = size;
            ext = response.Images[image].Sizes[size].ext;
          }
        }

        let url = `https://photos.smugmug.com/photos/${picID}/0/${largestSize}/${picID}-${largestSize}.${ext}`;
        links.push(url);
      }

      $("body").prepend(
        `<div id="downloadProgress">Downloading: [/${response.Pagination.TotalItems}]</div>`
      );
      let done = 0;
      links.forEach((url, i) => {
        let name = response.Albums[0].Title + "/" + url.split("/").slice(-1)[0];
        GM_download({
          url,
          name,
          onload: function (e) {
            done += 1;
            $("#downloadProgress").text(
              `Downloading: [${done}/${response.Pagination.TotalItems}]`
            );
            if (done == links.length) {
              $("#downloadProgress").text("Finished!");
              setTimeout(() => {
                $("#downloadProgress").remove();
              }, 3000);
            }
          },
        });
      });
    });
  });
});
