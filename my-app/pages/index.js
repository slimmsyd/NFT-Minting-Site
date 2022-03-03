import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, {useState, useEffect} from 'react'; 
import {ethers, Contract, utilis, utils} from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import Nav from './Nav';
import swal from 'sweetalert';
import Web3 from 'web3';


//Web3 Imports
import {WHITELISTADDRESS, whitelistContract_ABI, abi, NFT_CONTRACT_ADDRESS} from '../constants';
import { getJsonWalletAddress } from 'ethers/lib/utils';

export default function Home( ) {

  //whitelisted states
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);


  
  //All the connection stuff

  const [isConnected ,setIsConnected] = useState(false); 
  const [hasMetaMask, setHasMetaMask] = useState(false); 
  const [signer,setSigner] = useState(undefined);
  const [accountAddress, setAccountAddress] = useState("");
  const [loading, setLoading] = useState(false);


async function getProviderOrSigner(needSigner = false) { 
  await window.ethereum.request({method: "eth_requestAccounts"});
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  //Split The Adress String Up
  //Function that conats

    let result_1 = address.substring(0,5);
    let result_2 = address.substring(38,42); 
    let subStringAddress = result_1 + "..." + result_2;
    setAccountAddress(subStringAddress)

  //If user is not connected to rinkeby network let them know

  const {chainId} = await provider.getNetwork(); 
  if (chainId !== 4) { 
    window.alert("Change Network To Rinkeby");
    throw new  Error("Change Network To Rinkeby")
  }


  if(needSigner) { 
    const signer = provider.getSigner();
    return signer
  }
  return provider

};




useEffect(() => {
  if (typeof window.ethereum !== "undefined") {
    setHasMetaMask(true);
    Connect();

  }
 

  

});


//ADDRESS TO WHITELIST 


//gets number of Whitelisted addresses
const getNumberOfWhitelisted = async () => {
  try {
    //SetProvider to <TRUE>
    // No need for the Signer here, as we are only reading state from the blockchain
    const provider = await getProviderOrSigner(true);
    // We connect to the Contract using a Provider, so we will only
    // have read-only access to the Contract
    const whitelistContract = new Contract(
      WHITELISTADDRESS,
      whitelistContract_ABI,
      provider
    );
    // call the numAddressesWhitelisted from the contract
    const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
    setNumberOfWhitelisted(_numberOfWhitelisted);
  } catch (err) {
    console.error(err);
  }
};

const addAddressToWhitelist = async() => { 
  try { 
    //We need a signer here "write" transaction 
    const signer = await getProviderOrSigner(true);
    //create a new instance of the Contract with a Signer, which allows
    //update methods
    const whitelistContract = new Contract(
      WHITELISTADDRESS,
      whitelistContract_ABI,
      signer
    );
      //Call the addAddressWhiteListed from the contract
      const tx = await whitelistContract.addAddressToWhiteList();
      setLoading(true);
      //wait for tx to get mined
      await tx.wait();
      setLoading(false);
      //get the update Number of addresses in the Whitelist
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
  }catch(err) { 
    console.error(err)
  };


};





const checkIfAddressInWhitelist = async () => { 
  try { 
    //Signer to get the users address
    const signer = await getProviderOrSigner(true);
    const whitelistContract = new Contract(
      WHITELISTADDRESS,
      whitelistContract_ABI,
      signer
    );
      //Get the addresses associate to the signer 
      const address = await signer.getAddress();
      //call the whitelistedaddress from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddreses(address);
      //Remember to check State and setState again
      setJoinedWhitelist(_joinedWhitelist)
  }catch(err) { 
    console.error(err)
  }
}






const connectToSite = () => { 
  return( 
    
    <div className = {styles.card} >
    <h1>MINT A FAMILY NFT</h1>  
    <button onClick={Connect} className = {styles.mint}> Connect</button>
  </div>
  )
}

async function Connect() { 
  try { 
    //Get provider from ethers; 
    await getProviderOrSigner()
    setIsConnected(true);

    getNumberOfWhitelisted();
    getTokenIdsMinted()
    checkIfAddressInWhitelist();
    getOwner();
    console.log(isConnected);
  }catch(err) { 
    console.error(err)
  }
}

//MINTING FUNCTIONS 
const [tokenIdsMinted, setTokenIdsMinted] = useState(0);
const [isOwner, setIsOwner] = useState(false); 
const [preSaleStarted, setPreSaleStarted] = useState(false)
const [preSaleEnded, setPreSaleEnded] = useState(false);


//presaleMint 
const presaleMint = async() => { 
  try {
    const signer = await getProviderOrSigner(true);
    const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

    //call the presaleMint function
    const tx = await whitelistContract.presaleMint( { 
      value: utils.parseEther("0.01")
    });
    setLoading(true);
    //wait for transaction to get mined
    await tx.wait();
    setLoading(false);
    swal("You Successfully Minted A Family NFT");


  }catch(err) { 
    console.error(err)
  }
}

//Public Mint 
const publicMint = async() => { 
  try { 
    //Signer in transaction, writing to the blockchain
    const signer = await getProviderOrSigner(true);
    //new instance of Contract -> Nft contract
    const nftCotnract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
    );
      //calling mint from contract
      const tx = await nftCotnract.mint({
          //value signifies the cost of one FAMILY NFT
      //parsing the "0.01" string to ether ussing the utilis library from ethers.js
        value: utils.parseEther("0.01")
      });
      setLoading(true);
      //wait for transaction get mined
      await tx.wait();
      setLoading(false);
      swal("You Successfully Minted A Family NFT")


  }catch(err) { 
    console.error(err)
  };

};

const startPresale = async () => {
  try {
    const signer = await getProviderOrSigner(true);
    
    const whitelistContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
    );
    // call the startPresale from the contract
    const tx = await whitelistContract.startPresale();
    setLoading(true);
    // wait for the transaction to get mined
    await tx.wait();
    setLoading(false);
    // set the presale started to true
    await checkIfPreSaleStarted();
  } catch (err) {
    console.error(err);
  }
};

const getOwner = async() => { 
  try { 
    //No need for signer here
    const provider = await getProviderOrSigner(true);

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
    //call owner function from contract
    const _owner = await nftContract.owner();
    //get signer now to extract teh address of the currently connected MetaMask account
    const signer = await getProviderOrSigner(true);
    const address = await signer.getAddress();
    if(address.toLowerCase() === _owner.toLowerCase()) { 
      setIsOwner(true);
      console.log(_owner)
      console.log(address)
     
    }
  }catch(err) { 
    console.error(err)
  }
};

const checkIfPreSaleStarted = async() => { 
  try { 
    const provider = getProviderOrSigner();
    //only read-only access to contract
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    //call the presale from the contract
    const _presaleStarted = await nftContract.presaleStarted();
    if(!_presaleStarted) {
      await getOwner();
    };
    setPreSaleStarted(_presaleStarted);
    return _presaleStarted;
  }catch(err) { 
    console.error(err)
  }
};
const checkIfPreSaleEnded = async() => { 
  try {
    const provider = await getProviderOrSigner();

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    const _presaleEnded = await nftContract.presaleEnded();
    //_presaleEnded is a Big Number, so we are using It(less than function) instad of <
    //Date.now()/1000 returns the current time in seconds
    //We compare if the _prealeEnded timestamp
    const hasEnded = _presaleEnded.It(Math.floor(Date.now()/1000));
    if(hasEnded) { 
        setPreSaleEnded(true);
    }else { 
      setPreSaleEnded(false);
    }
    return hasEnded;
  }catch(err) { 
    console.error(err);
  }
};




const getTokenIdsMinted = async() => { 
  try {

  const provider = await getProviderOrSigner();
  const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

  const _tokenIds = await nftContract.tokenIds();
  //_tokenIds is a "Big Number". We need to convert the Big Number to a string
  setTokenIdsMinted(_tokenIds.toString());

}catch(err) {
  console.error(err)
}
}


const renderButton = () => { 
  if(isConnected) { 
    if(joinedWhitelist) { 
      return (
        <div className = {styles.card} >
        <h1>THANKS for joining the whitlist</h1>  

         </div>
      );
    }else if(loading) { 
      return <button className = {styles.mint}>Loading...</button>
    }else {
      return(
        <div className = {styles.card}>
          <button onClick = {addAddressToWhitelist} className = {styles.mint}>
          Join The whitlist 
        </button>
        </div>
      
        
      );
    }
  }else {
    connectToSite();
  }


}




//Dispaly Options to Start The Presale 
//NULL VOID FUNCTION ATM -> Looking To Debug

// if (isOwner && !preSaleStarted) { 
//   return ( 
//     <main className= {styles.mainPresale}>
//       <h1 className={styles.title}> Join The <a href="#">Family</a> NFT</h1>
//     <div className = {styles.card} >
//       <button onClick={startPresale} className = {styles.mint}> Start Presale</button>  
// </div>
// </main>
//   )
// }

// if(!preSaleStarted && !joinedWhitelist) {
//   return(
//     <main className= {styles.mainPresale}>
//       {renderButton()}
   
// </main>
     
//   )
// }

// if (preSaleStarted  && !presaleEnded) { 
//   return ( 
//     <div className = {styles.card} >
//       <div className = {styles.description}>
//         Presale Has Started!!! IF your address is whitelisted. Mint A Family NFT
//       </div>
//       <button className = {styles.mint}
//         onClick = {presaleMint}
//       >
//         PreSale Mint!!
//       </button>

//     </div>
//   )
// }




  return (

    <div className={styles.container}>
      <Nav
        accountAddress = {accountAddress}
      />
      <Head>
        <title>Family DAO</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.flex_main}>
            <h1 className={styles.title}>
              Welcome to <a href="#">Family DAO</a>
            </h1>


          
          <div className = {styles.card} >
            <button onClick={publicMint} className = {styles.mint}>MINT A FAMILY NFT</button>  
            </div>
            </div>

            {renderButton()}
            
          <div className = {styles.card} >
            <h1>{numberOfWhitelisted} have already joined the whitelist</h1>  
            <h1>This about minted {tokenIdsMinted}</h1>
            </div>
        
     
        

      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created For {""}
          <span className={styles.logo}>
           Sanders Family
          </span>
        </a>
      </footer>
    </div>
  )
}
