import { BigNumber, ethers } from 'ethers';

import { CONFIG } from '@/utils/config';

let MINTER_ROLE: string;
const getMinterRole = async (): Promise<string> => {
  if (MINTER_ROLE) return MINTER_ROLE;
  const abi = new ethers.utils.Interface([
    'function MINTER_ROLE() public view returns (bytes32)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );
  MINTER_ROLE = await contract.MINTER_ROLE();
  return MINTER_ROLE;
};

let CRON_ROLE: string;
const getCronRole = async (): Promise<string> => {
  if (CRON_ROLE) return CRON_ROLE;
  const abi = new ethers.utils.Interface([
    'function CRON_JOB() public view returns (bytes32)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );
  CRON_ROLE = await contract.CRON_JOB();
  return CRON_ROLE;
};

export const checkMintStatus = async (tokenID: number): Promise<boolean> => {
  const abi = new ethers.utils.Interface([
    'function ownerOf(uint256 tokenId) public view returns (address)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );

  try {
    await contract.ownerOf(tokenID); // ownerOf will revert if token is not minted
    return true;
  } catch (error) {
    return false;
  }
};

export const verifyOwnership = async (
  minterAddress: string,
  tokenID: number
): Promise<boolean> => {
  const abi = new ethers.utils.Interface([
    'function ownerOf(uint256 tokenId) public view returns (address)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );

  try {
    const ownerAddress = await contract.ownerOf(tokenID);
    return minterAddress === ownerAddress.toLowerCase();
  } catch (error) {
    console.error('Error fetching ownerOf', error);
    return false;
  }
};

export const ensureValidCronWallet = async (): Promise<void> => {
  const balance = await CONFIG.CRON_WALLET.getBalance();
  if (balance.lte(0)) {
    throw new Error('CRON_PRIVATE_KEY must have non-zero balance');
  }

  const abi = new ethers.utils.Interface([
    'function hasRole(bytes32 role, address account) public view returns (bool)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );

  const { address } = CONFIG.CRON_WALLET;

  const hasRole = await contract.hasRole(await getCronRole(), address);

  if (!hasRole) {
    throw new Error('CRON_PRIVATE_KEY must have CRON_JOB role');
  }
};

export const hasMinterRole = async (address: string): Promise<boolean> => {
  const abi = new ethers.utils.Interface([
    'function hasRole(bytes32 role, address account) public view returns (bool)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );

  return contract.hasRole(await getMinterRole(), address);
};

export const getMerkleRoot = async (): Promise<string> => {
  const abi = new ethers.utils.Interface([
    'function _merkleRoot() public view returns (bytes32)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );

  // eslint-disable-next-line no-underscore-dangle
  return contract._merkleRoot();
};

export const updateMerkleRoot = async (
  root: string
): Promise<ethers.providers.TransactionResponse> => {
  const abi = new ethers.utils.Interface([
    'function cronJobRoot(bytes32 newRoot) external'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );

  return contract.cronJobRoot(root);
};

export const getMinimumPrice = async (): Promise<BigNumber> => {
  const abi = new ethers.utils.Interface([
    'function minimumPrice() public view returns (uint256)'
  ]);

  const contract = new ethers.Contract(
    CONFIG.POIGNART_CONTRACT,
    abi,
    CONFIG.CRON_WALLET
  );

  try {
    return contract.minimumPrice();
  } catch {
    return BigNumber.from(0);
  }
};
