document.addEventListener("DOMContentLoaded", () => {
  const web3Modal = new window.Web3Modal.default({
    network: "base",
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: window.WalletConnectProvider.default,
        options: {
          rpc: {
            8453: "https://mainnet.base.org"
          },
          chainId: 8453
        }
      }
    }
  });

  async function updateNavigation() {
    const profile = JSON.parse(localStorage.getItem('profile'));
    if (profile) {
      const profileLink = document.getElementById('profile-link');
      profileLink.href = `/profile/${profile.name}`;
      profileLink.style.display = 'block';
      document.getElementById('wallet-connect').style.display = 'none';
      document.getElementById('wallet-disconnect').style.display = 'block';
    } else {
      document.getElementById('profile-link').style.display = 'none';
      document.getElementById('wallet-connect').style.display = 'block';
      document.getElementById('wallet-disconnect').style.display = 'none';
    }
  }

  // Make the function available globally
  window.updateNavigation = updateNavigation;

  async function connectWallet() {
    try {
      const provider = await web3Modal.connect();
      const web3 = new Web3(provider);

      const chainId = await web3.eth.getChainId();
      if (chainId !== 8453) {
        alert("Please switch to the Base network");
        return;
      }

      const accounts = await web3.eth.getAccounts();
      const address = accounts[0];

      // Send the address to your server for authentication
      const response = await fetch('/api/users/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      const result = await response.json();

      if (result.success) {
        localStorage.setItem('profile', JSON.stringify(result.profile));
        console.log("Profile saved to localStorage:", result.profile); // Debugging
        updateUI(result.profile);
        handleWalletConnection(); // Reload the page after successful connection
      } else {
        alert('Authentication failed');
      }

      console.log("Wallet connected:", address);
      return address;
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  function disconnectWallet() {
    localStorage.removeItem('profile');
    web3Modal.clearCachedProvider();
    updateUI(null);
    handleWalletConnection(); // Reload the page after disconnection
  }

  function updateUI(profile) {
    const walletConnectButton = document.getElementById('wallet-connect');
    const walletDisconnectButton = document.getElementById('wallet-disconnect');
    const profileLink = document.getElementById('profile-link');

    if (profile) {
      if (walletConnectButton) walletConnectButton.style.display = 'none';
      if (walletDisconnectButton) walletDisconnectButton.style.display = 'block';
      if (profileLink) {
        profileLink.style.display = 'block';
        profileLink.href = `/profile/${profile.address}`;
      }
    } else {
      if (walletConnectButton) walletConnectButton.style.display = 'block';
      if (walletDisconnectButton) walletDisconnectButton.style.display = 'none';
      if (profileLink) profileLink.style.display = 'none';
    }
  }

  async function authenticateUser(address) {
    const response = await fetch('/api/users/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });

    const result = await response.json();
    if (result.success) {
      return result.profile;
    } else {
      throw new Error('Authentication failed');
    }
  }

  function handleWalletConnection() {
    // Reload the page to reflect the updated ownership status
    window.location.reload();
  }

  const walletConnectButton = document.getElementById('wallet-connect');
  const walletDisconnectButton = document.getElementById('wallet-disconnect');

  if (walletConnectButton) {
    walletConnectButton.addEventListener('click', connectWallet);
  }
  if (walletDisconnectButton) {
    walletDisconnectButton.addEventListener('click', disconnectWallet);
  }

  // Initiale Navigation aktualisieren, wenn die Seite geladen wird
  document.addEventListener('DOMContentLoaded', updateNavigation);

  // Check connection status on page load
  const profile = JSON.parse(localStorage.getItem('profile'));
  console.log("Profile on page load:", profile); // Debugging
  updateUI(profile);
});