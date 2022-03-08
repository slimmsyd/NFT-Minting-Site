import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, {useState, useEffect, useRef} from 'react'; 
import {ethers, Contract, utilis, utils, providers, BigNumber} from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import Nav from './Nav';
import swal from 'sweetalert';
import Web3 from 'web3';
import Web3Modal from 'web3modal';



//Web3 Imports
import {WHITELISTADDRESS, whitelistContract_ABI, abi, NFT_CONTRACT_ADDRESS, TOKEN_ABI, TOKEN_CONTRACT_ADDRESS} from '../constants';
import { getJsonWalletAddress } from 'ethers/lib/utils';

export default function Home( ) {

  //whitelisted states
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);

  //token states
  const [ownerTokenId, setOwnerTokenId] = useState(0);
  //Create A BigNumber "0'
  const zero = BigNumber.from(0);
  //tokensToBeClaimed keeps track of the humber of tokens that can be claiemd
  //based no the Family NFT help by the user for which they havn'et claimed tokens
  const [tokensToBeClaimed, setTokensToBeclaimed] = useState(zero);
  //balanceofToken keeps track of number of Family Members tokens owned by address
  const [balanceOfFamilyToken, setBalanceOfFamilyToken] = useState(zero);
  //Amount of tokens that user wants to mint;
  const [tokenAmount, setTokenAmount] = useState(zero);
  //tokensMinted is the total number of tokens have been minted till now out of 10000(max total supply);
  const [tokensMinted, setTokensMinted] = useState(zero);


  
  //All the connection stuff
  //Note To Self, Don't put useRef in []
  const web3Modalref = useRef()
  const [isConnected ,setIsConnected] = useState(false); 
  const [hasMetaMask, setHasMetaMask] = useState(false); 
  const [signer,setSigner] = useState(undefined);
  const [accountAddress, setAccountAddress] = useState("");
  const [loading, setLoading] = useState(false);

  //Token Contract Funcions below

  const getTokensToBeClaimed = async() => { 
    try { 
      const provider = await getProviderOrSigner();
      //create a new instance of NFT contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
     
        //signer to attract address of currenty connect metamask account
        const signer = await getProviderOrSigner(true);
        const address = signer.getAddress();
        const tokenContract = new Contract (
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_ABI,
          provider
        )
        //call the balanceOF from the NFT contract to get the number of NFTS held by user
        const balance = await nftContract.balanceOf(address);
        //balance is a Big number and thust we would compare it with Big Number 'zero'
        if(balance ===zero) { 
          setTokensToBeclaimed(zero);
        }else { 
          //amount keeps track of the # of unclaimed tokens
          var amount = 0;
          //For all the NFTS, check if the tokens have already been claimed
          //Only increase the amount if the tokens have not been claimed
          //for a an NFT(for a given tokenID)
          for(var i = 0; i < balance;i++) { 
            const tokenId = await nftContract.tokenOfOwnerByIndex(address, i );
            const claimed  = await tokenContract.tokenIdsClaimed(tokenId);
            if(!claimed) { 
              amount++;
            }
          };

          //tokensToBeClaimed has been initizlied to a big Number, thus we would conver amount
          //to a big number and then set its value
          setTokensToBeclaimed(BigNumber.from(amount));
        }


    }catch(err) { 
      console.error(err)
    }
  };

  //Checks balance of Tokens held by an address
  const getBalanceOfNfts = async() => { 
    try { 
      const proivder = await getProviderOrSigner();
      //create a instance of token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_ABI,
        proivder
      );
        const signer = await getProviderOrSigner(true);
        const address = signer.getAddress();
        const balance = await tokenContract.balanceOf(address);
        setBalanceOfFamilyToken(balance);
    }catch(err) { 
      console.error(err)
      setBalanceOfFamilyToken(zero);
    };
  };

  //mints 'amount' number of tokens to a given address
  
  const mintFamilyToken = async(amount) => {

    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_ABI,
      signer
    );
    //each token is of '0.001 ether' The value we need to send is '0.001 amount'
    const value = 0.001 * amount;
    const tx = await tokenContract.mint(amount, {

      value: utils.parseEther(value.toString())
    });
    setLoading(true);
    //wait for transaction to get mined
    await tx.wait();
    setLoading(false);
    swal("You mined a Family Token");
    await getBalanceOfNfts();
    await getTokensToBeClaimed();
    await getTotalTokensMinted()
    }catch(err) { 
      console.error(err)
    }
    
    

  };

  //helps the user claim tokens
  const claimCryptoDevTokens = async() => { 
      try {
        const signer = await  getProviderOrSigner(true);

        const tokenContract = new Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_ABI,
          signer
        );
        const tx = await tokenContract.claim();
        setLoading(true);
        await tx.wait();
        setLoading(false);
        swal("You claimed your Faimly Tokens");
        await getBalanceOfNfts();
        await getTokensToBeClaimed();
        await getTotalTokensMinted()
      }catch(err) { 
        console.error(err)
      }
  };

  //retrives how many tokens have been minted till now
  //out of total supply
  
  async function getTotalTokensMinted() { 
    try { 
      const provider = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_ABI,
        provider
      );
         //Get all Tokens that have been mined
         const _tokensMinted = await tokenContract.totalSupply();
         console.log(_tokensMinted, "checking this out ")

         setTokensMinted(_tokensMinted);
    }catch(err) { 
      console.error(err)
    };
  }





  //Token Contract Funcions Above




async function getProviderOrSigner(needSigner = false) { 

  const provider = await web3Modalref.current.connect();
  const web3Provider = new providers.Web3Provider(provider)
  const signer = web3Provider.getSigner();
  const address = await signer.getAddress();

  //Split The Adress String Up
  //Function that conats

    let result_1 = address.substring(0,5);
    let result_2 = address.substring(38,42); 
    let subStringAddress = result_1 + "..." + result_2;
    setAccountAddress(subStringAddress)

  //If user is not connected to rinkeby network let them know

  const {chainId} = await web3Provider.getNetwork(); 
  if (chainId !== 4) { 
    window.alert("Change Network To Rinkeby");
    throw new  Error("Change Network To Rinkeby")
  }


  if(needSigner) { 
    const signer = web3Provider.getSigner();
    return signer
  }
  return web3Provider;

};







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

//code converts a string to int
function toInt(string) { 
  var value = parseInt(string)
  return value;
}

const checkIfSenderHasToken = async() => { 
  try { 
    const provider = await getProviderOrSigner(true);

    const nftContract  = new Contract(
     //New Contract Goes Address, ABI, Provider
     NFT_CONTRACT_ADDRESS,
     abi,
     provider

    );
    //For my code sake, convert to string then back to int
      const _checkIfOwnerHasToken = await nftContract.returnTokenId();
      const _checkIfOwnerHasToken_toString = _checkIfOwnerHasToken.toString();
      const amount = toInt(_checkIfOwnerHasToken_toString);
      
       setOwnerTokenId(amount)
     

    
      
      
  }catch(err) { 
    console.error(err)
  }



}



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
    checkIfAddressInWhitelist();
    getOwner();
    getTokenIdsMinted();
    getBalanceOfNfts();
    checkIfSenderHasToken();
    getTokensToBeClaimed()
    getTotalTokensMinted();
    console.log(isConnected);
  }catch(err) { 
    console.error(err)
  }
};


useEffect(() => {
  if(!isConnected) { 
    web3Modalref.current = new Web3Modal({
      network: "rinkeby",
      providerOptions: {},
      disableInjectedProvider: false,
    });
      Connect();



  }

  

});
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

  
  if(loading)  { 
    return ( 
      <div>
        <button className = {styles.mint}>Loading</button>
      </div>
    )
  }
  if(isConnected) { 
    if(ownerTokenId === 1) {
      if(tokensToBeClaimed > 0 ) {
        return (
          <div className={styles.card}>
              <div className = {styles.card} >
          <h3>You Own A Nft</h3>  
           </div>
           <div className = {styles.card}>
             {tokensToBeClaimed * 10} Tokens can be claimed!!
           </div>
           <button className = {styles.mint} onClick = {claimCryptoDevTokens}>Claim Your Tokens</button>
          </div>
        
           
        );
      } 
      
    }else if(loading) { 
      return <button className = {styles.mint}>Loading...</button>
    }else {
      return(
        <div className = {styles.card}>
          <button onClick = {publicMint} className = {styles.mint}>
          Mint NFT
        </button>
        </div>
      
        
      );
    }
  }else {
    connectToSite();
  }
  return (
    <div>
      <input
      type = "numeber"
      placeholder='Amount Of Tokens'
      //Big number.from converts the 'e.target.value' to a BigNumebr
      onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}>
        
      </input>
      <button
      className = {styles.mint}
      disabled = {!tokenAmount > 0}
      onClick = {() => mintFamilyToken(tokenAmount)}>
        Mint Tokens
      </button>

    </div>
  )


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
            <p className={styles.description}>
              You can claim or mint your Tokens Here
            </p>
         
            </div>
            <div className={styles.card}>

                You have minted {utils.formatEther(balanceOfFamilyToken)} Family Tokens
            </div>
            <div className = {styles.card}>
              Overall {utils.formatEther(tokensMinted)}/10000 have minted 
            </div>
            {renderButton()}
            
          <div className = {styles.card} >
            <h1>{numberOfWhitelisted} have already joined the whitelist</h1>  
            <h1>NFTS current claimed {tokenIdsMinted} / 5</h1>
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
