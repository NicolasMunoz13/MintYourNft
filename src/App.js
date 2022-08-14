import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import axios from 'axios'
import logo from './logo.svg';
import './App.css';
import myNft from './utils/MyEpicNFT.json'

const REACT_APP_PINATA_API_KEY = "aed0750e7ed29375bf33";
const REACT_APP_PINATA_API_SECRET = "51eae4a0095196e59f38c2cffc74977d78f11493eba88a30e6e67fe99e9b3ee6";

function App(){

  const [currentAccount, setCurrentAccount] = useState("");
  
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error);
    }
  }

  const askContractToMintNft = async () => {
  const CONTRACT_ADDRESS = "0x75E48263A7279e285D7f05E0B20A265ad4Ccc3fA";

  try {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myNft.abi, signer);

      console.log("Going to pop wallet now to pay gas...")
      let nftTxn = await connectedContract.makeAnEpicNFT();

      console.log("Mining...please wait.")
      await nftTxn.wait();
      
      console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
  }
}

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const [fileImg, setFileImg] = useState(null);

  const sendFileToIPFS = async (e) => {
    if (fileImg) {
      try {
        e.preventDefault();
        const formData = new FormData();
        formData.append("file", fileImg);
        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            'pinata_api_key': REACT_APP_PINATA_API_KEY,
            'pinata_secret_api_key': REACT_APP_PINATA_API_SECRET,
            "Content-Type": "multipart/form-data"
          },
        });

        const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
        console.log(ImgHash);
        let name = document.getElementById("name").value;
        let description = document.getElementById("description").value;
        let attributeType = document.getElementById("attributeType").value;
        let attributeInfo = document.getElementById("attributeInfo").value;


        let data = JSON.stringify({
          "pinataOptions": {
            "cidVersion": 1
          },
          "pinataMetadata": {
            "name": "testJson",
            "keyvalues": {
              "customKey": "customValue",
              "customKey2": "customValue2"
            }
          },
          "pinataContent": {
            "name": name,
            "description": description,
            "image": ImgHash,
            "attributes": [
              {
                "trait-type": attributeType,
                "value": attributeInfo
              }
            ]
          }
        });

        console.log(data);

        const resData = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
          data: data,
          headers: {
            'pinata_api_key': REACT_APP_PINATA_API_KEY,
            'pinata_secret_api_key': REACT_APP_PINATA_API_SECRET,
            'Content-Type': 'application/json',
          },
        })

        console.log(resData);

        let config = {
          method: 'post',
          url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': REACT_APP_PINATA_API_KEY,
            'pinata_secret_api_key': REACT_APP_PINATA_API_SECRET,
          },
          data: data
        };

        document.getElementById("name").value = "";
        document.getElementById("description").value = "";
        document.getElementById("attributeType").value = "";
        document.getElementById("attributeInfo").value = "";
        document.getElementById("input_file").value = "";

        const res = await axios(config);

        console.log(res.data);

        //Take a look at your Pinata Pinned section, you will see a new file added to you list.   
        return ImgHash;

      } catch (error) {
        console.log("Error sending File to IPFS: ")
        console.log(error)
      }
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Input NFT information</h1>
        <img src={logo} className="App-logo" alt="logo" />

        <form onSubmit={sendFileToIPFS}>
          <section>
            <div class="field_flex">
              <h2>Nombre</h2>
              <input id="name" />
            </div>
            <div class="field_flex" >
              <h2>Descripcion</h2>
              <input id="description" />
            </div>
            <div class="field_flex">
              <h2 class="img__field">Imagen</h2>
              <input id='input_file' type="file" onChange={(e) => setFileImg(e.target.files[0])} />
            </div>
            <div class="field_flex" >
              <h2>Atributos</h2>
              <input placeholder="Tipo" id="attributeType" />
              <input placeholder="Informacion" id="attributeInfo" />
            </div>
          </section>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <button type='submit' onClick={askContractToMintNft} className="cta-button connect-wallet-button">Mintea tu NFT</button>
          )}
        </form>
      </header>

    </div>
  );
}

export default App;
