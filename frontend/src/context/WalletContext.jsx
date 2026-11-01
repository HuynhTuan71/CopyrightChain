import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { TARGET_CHAIN_ID, TARGET_CHAIN_ID_HEX } from "../utils/contract";

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  const isCorrectNetwork = Number(chainId) === TARGET_CHAIN_ID;

  // Cập nhật số dư ví
  const updateBalance = useCallback(async (userAddress, ethProvider) => {
    try {
      if (!userAddress || !ethProvider) return;
      const bal = await ethProvider.getBalance(userAddress);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Lỗi khi lấy số dư ví:", err);
    }
  }, []);

  // Yêu cầu MetaMask chuyển sang mạng Ethereum Sepolia
  const switchToSepolia = async () => {
    if (!window.ethereum) {
      toast.error("Vui lòng cài đặt ví MetaMask để sử dụng tính năng này!", {
        duration: 4000,
      });
      return false;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID_HEX }],
      });
      toast.success("Đã chuyển sang mạng Ethereum Sepolia!");
      return true;
    } catch (switchError) {
      // Mã lỗi 4902 nghĩa là mạng Sepolia chưa được thêm vào MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: TARGET_CHAIN_ID_HEX,
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "SEP",
                  decimals: 18,
                },
                rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          toast.success("Đã thêm và chuyển sang mạng Sepolia thành công!");
          return true;
        } catch (addError) {
          toast.error("Không thể thêm mạng Sepolia vào MetaMask.");
          return false;
        }
      }
      if (switchError.code === 4001) {
        toast.error("Bạn đã từ chối chuyển mạng.");
      } else {
        toast.error("Lỗi khi chuyển mạng sang Sepolia.");
      }
      return false;
    }
  };

  // Khởi tạo kết nối ví MetaMask
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-amber-300">
              Chưa cài đặt ví MetaMask!
            </span>
            <span className="text-sm text-slate-300">
              Vui lòng cài đặt tiện ích MetaMask trên trình duyệt để kết nối.
            </span>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="text-xs bg-brand-blue hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg text-center mt-1 transition-all"
            >
              Tải MetaMask ngay
            </a>
          </div>
        ),
        { duration: 6000 }
      );
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        const userSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);

        setAccount(accounts[0]);
        setChainId(currentChainId);
        setProvider(browserProvider);
        setSigner(userSigner);

        await updateBalance(accounts[0], browserProvider);

        if (currentChainId !== TARGET_CHAIN_ID) {
          toast.custom((t) => (
            <div className="glass-card bg-amber-950/80 border-amber-500/40 p-4 rounded-xl shadow-xl flex flex-col gap-2 max-w-sm">
              <p className="font-semibold text-amber-300 text-sm">
                ⚠️ Sai mạng kết nối!
              </p>
              <p className="text-xs text-slate-300">
                DApp hoạt động trên mạng <strong>Ethereum Sepolia</strong>. Vui lòng chuyển mạng để tiếp tục.
              </p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  switchToSepolia();
                }}
                className="mt-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg transition"
              >
                Chuyển sang Sepolia ngay
              </button>
            </div>
          ));
        } else {
          toast.success("Kết nối ví MetaMask thành công!");
        }
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
      if (error.code === 4001) {
        toast.error("Bạn đã huỷ yêu cầu kết nối ví.");
      } else {
        toast.error(error.message || "Không thể kết nối ví MetaMask.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Ngắt kết nối ví
  const disconnectWallet = () => {
    setAccount("");
    setSigner(null);
    setBalance("0");
    toast("Đã ngắt kết nối ví", { icon: "🔌" });
  };

  // Lắng nghe sự kiện đổi tài khoản hoặc đổi mạng từ MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const checkExistingConnection = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_accounts", []);
        if (accounts.length > 0) {
          const userSigner = await browserProvider.getSigner();
          const network = await browserProvider.getNetwork();
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));
          setProvider(browserProvider);
          setSigner(userSigner);
          updateBalance(accounts[0], browserProvider);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra kết nối sẵn có:", err);
      }
    };

    checkExistingConnection();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (provider) {
          provider.getSigner().then(setSigner);
          updateBalance(accounts[0], provider);
        }
        toast.success("Đã đổi địa chỉ ví!");
      }
    };

    const handleChainChanged = (newChainId) => {
      const parsedChainId = parseInt(newChainId, 16);
      setChainId(parsedChainId);
      // Khi đổi mạng, nên làm mới provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      if (account) {
        browserProvider.getSigner().then(setSigner);
        updateBalance(account, browserProvider);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [account, provider, updateBalance]);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        balance,
        isConnecting,
        isCorrectNetwork,
        signer,
        provider,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet phải được dùng bên trong WalletProvider");
  }
  return context;
};
