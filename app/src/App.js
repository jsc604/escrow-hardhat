import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

const walletProvider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [approvedEscrows, setApprovedEscrows] = useState(() => {
    const storedEscrows = localStorage.getItem("approvedEscrows");
    return storedEscrows ? JSON.parse(storedEscrows) : [];
  });


  useEffect(() => {
    async function getAccounts() {
      const accounts = await walletProvider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(walletProvider.getSigner());
    }

    getAccounts();
  }, [account]);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.utils.parseEther(document.getElementById('eth').value);
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);
    const senderAddress = await signer.getAddress();

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";

          const newApprovedEscrows = ([
            ...approvedEscrows, { 
              tx: escrowContract.address, 
              arbiter, beneficiary, 
              senderAddress, 
              value 
            }
          ]);

          setApprovedEscrows(newApprovedEscrows);
          localStorage.setItem("approvedEscrows", JSON.stringify(newApprovedEscrows));
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows([...escrows, escrow]);
  }
  
  return (
    <div className='flex justify-between w-full'>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Eth)
          <input type="text" id="eth" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Approved Contracts </h1>

        <div id="container">
          {approvedEscrows.map((address) => {
            return (
              <ul className="fields">
                <li>
                  <div className='font-semibold'> Transaction Hash </div>
                  <div> {address.tx} </div>
                </li>
                <li>
                  <div className='font-semibold'> Sender </div>
                  <div> {address.senderAddress} </div>
                </li>
                <li>
                  <div className='font-semibold'> Value </div>
                  <div> {parseInt(address.value.hex) / 10 ** 18} Eth</div>
                </li>
                <li>
                  <div className='font-semibold'> Beneficiary </div>
                  <div> {address.beneficiary} </div>
                </li>
                <li>
                  <div className='font-semibold'> Arbiter </div>
                  <div> {address.arbiter} </div>
                </li>
              </ul>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
