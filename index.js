const puppeteer = require('puppeteer');
const BASE_URL = "https://chords.cloud";
let recordsInserted = 0;
const excel = require('exceljs');
let workbook = new excel.Workbook();
let worksheet = workbook.addWorksheet('chords');
worksheet.columns = [
    {header:"Title", key: "title"},
    {header:"Artist", key: "artist"},
    {header:"Genre", key: "genre"},
    {header:"Chord", key: "chord"}
]

async function getChordDetails(page, url) {
    await page.goto(BASE_URL + url);
    try {
        let artist = null;
        try{artist = await (await page.$eval('h4.h6 a', node => node.textContent));}
        catch{}
        let genre = null;
        try{genre = await (await page.$eval("html body div div div div div p", node => node.textContent));}
        catch{}
        let chord = await page.$eval("#chords-wrapper #chords", node => node.textContent);
        let title = await page.$eval("html body div div div h1.h3", node => node.textContent);

        return {
            title,
            artist,
            genre,
            chord
        }
    } catch {
        try {
            let artist = null;
            try{artist = await (await page.$eval('h4.h6 a', node => node.textContent));}
            catch{}
            let genre = null;
            try{genre = await (await page.$eval("html body div div div div div p", node => node.textContent));}
            catch{}
            let chord = await page.$eval("#chords-wrapper #chords", node => node.textContent);
            let title = await page.$eval("html body div div div h1.h3", node => node.textContent);
    
            return {
                title,
                artist,
                genre,
                chord
            }
        } catch(e) {
            return null;
        }
    }
}

async function getArtistChords(page, url, artistCategory, artist) {
    let artistChordDetails = []
    await page.goto(BASE_URL + url);
    let artistChords = await page.$$eval("html body div div div table tbody tr td a", nodes => nodes.map(node => node.getAttribute("href")));
    for (let i = 0; (i < artistChords.length && i <= 3); i++) {
        let chordDetails = await getChordDetails(page, artistChords[i]);
        if(chordDetails != null){
            artistChordDetails.push(chordDetails);
        }
        console.log(JSON.stringify({artistCategory, artist, chord: i, isNull: chordDetails == null}))
    }
    worksheet.addRows(artistChordDetails);
    try{
        workbook.xlsx.writeFile('Chords_'+artistCategory+'.xlsx');
    }catch{}
    let count = artistChordDetails.length;
    console.info({artistCategory, artist, count});
    recordsInserted += count;
    console.log("records inserted: "+recordsInserted);
}

async function getAllArtistsInCategory(page, url, artistCategory) {
    await page.goto(BASE_URL + url);
    let allArtists = await page.$$eval("html body div div div ul li a", nodes => nodes.map(node => node.getAttribute("href")));
    for (let i = 3200 ; i < allArtists.length ; i++) {
        await getArtistChords(page, allArtists[i], artistCategory, i);
        console.log("artists fetched in category "+artistCategory+" are "+(i-25)+"/"+(allArtists.length-25))
    }
}

async function main() {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setDefaultNavigationTimeout(0);
    await page.goto("https://chords.cloud/");

    let findArtistLinks = await page.$$eval("html body div div div ul li a", nodes => nodes.map(node => node.getAttribute("href")));
    // for(let i = 0; i < findArtistLinks.length; i++){
        await getAllArtistsInCategory(page, findArtistLinks[0], 0);
    // }
    await browser.close();
}
main();