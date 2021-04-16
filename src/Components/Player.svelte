<script>
  const {ipcRenderer} = require('electron')
  const {Howl, Howler} = require('howler');
  
// From Electron
let src
let songSrc = []
    // ipcRenderer.on('src', (e,data) =>{
    //     setSrc(data)
    //   })

      function clickedSrc(e){
        e.preventDefault();
        let getHref = e.currentTarget.getAttribute("href")
        let sound = new Howl({
        src: [getHref],
        volume: 1.0,
        });
        sound.play();
        setSrc(getHref)
        
      }
    
    function setSrc(msg){
       src = msg
       
      }

      function test(){
        let sound = new Howl({
        src: [src],
        volume: 1.5,
        });
        sound.play();
      }

     

    // Dialog
    ipcRenderer.on('srcPath', (e,data) =>{
      srcPaths(data)
    })

    function srcPaths(path){
      songSrc = path
     
    }
// Svelte

function openDialog(){
  ipcRenderer.send("opendialog")
}

</script>




<section  class="section is-flex-direction-column " style="height: 40%; width:100%;">

   <div class="table-container table__wrapper" style=" overflow-y:scroll; height:300px">
    <table class="table is-fullwidth is-align-content-center is-justify-content-center " style="width:100%;">
      <thead>
        <tr>
          <!-- <th class="sticky">Artist</th> -->
          <th class="sticky">Song</th>
        </tr>
      </thead>
      <tbody>
        {#if songSrc !== []}
          {#each songSrc as source}
              <tr>
                  <!-- <th>Seether</th> -->
                  <td><a href="{source}" on:click="{clickedSrc}" title="">{source}</a>
              </tr>
      
            {/each}
        {/if}
      </tbody>
    </table>
  </div> 
    <div class="buttons is-align-content-center is-justify-content-center is-justify-content-space-evenly "style="height: 100%; width:100%;">
        <button class="button is-danger " on:click="{openDialog}">Play</button>
        <button class="button is-link" on:click="{test}">Stop</button>
       
      </div>
</section>