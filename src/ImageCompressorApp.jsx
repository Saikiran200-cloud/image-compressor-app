"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// Robust Dummy CompressorJS class for reliable simulation in sandbox environments.
// In a real browser environment with the CDN loaded, the actual `window.Compressor` will be used.
class Compressor {
    constructor(file, options) {
        // Basic validation: ensure a File object is provided
        if (!(file instanceof File)) {
            options.error(new Error("Invalid file type provided to Compressor. (Simulated error)"));
            return;
        }

        // Simulate asynchronous compression, ensuring success or error callbacks are always called.
        setTimeout(() => {
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (options.progress && progress <= 100) {
                    options.progress(percentage);
                } else {
                    clearInterval(progressInterval);
                }
            }, 50); // Update progress every 50ms

            setTimeout(() => {
                clearInterval(progressInterval); // Ensure interval is cleared

                const originalSize = file.size;
                const quality = options.quality !== undefined ? options.quality : 0.8;

                // Simulate compression: create a dummy Blob with arbitrary content but correct type.
                // This avoids complex Base64 decoding issues while still providing a downloadable file.
                const simulatedCompressedSize = Math.max(1024, Math.floor(originalSize * quality * 0.5)); // Ensure it's always smaller, min 1KB
                
                // Create an array of random bytes for the dummy content
                const dummyContent = new Uint8Array(simulatedCompressedSize).map(() => Math.floor(Math.random() * 256));
                const compressedBlob = new Blob([dummyContent], { type: file.type });

                // Define the name of the simulated compressed file with '_ai' suffix
                const originalFileNameParts = file.name.split('.');
                const extension = originalFileNameParts.pop();
                const baseName = originalFileNameParts.join('.');
                const newFileName = `${baseName}_ai.${extension}`;

                Object.defineProperty(compressedBlob, 'name', { value: newFileName, writable: false });
                // Explicitly set simulated reduced size on the Blob object for consistent display
                Object.defineProperty(compressedBlob, 'size', { value: simulatedCompressedSize, writable: false }); 

                if (options.success) {
                    options.success(compressedBlob);
                }
            }, 500); // Simulate total compression time of 0.5 seconds
        }, 100); // Initial delay to allow UI to render 'Compressing...'
    }
}


// Simple Toast Component for notifications
const Toast = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const textColor = 'text-white';
    const borderColor = type === 'success' ? 'border-green-700' : type === 'error' ? 'border-red-700' : 'border-blue-700';

    return (
        <div className={`fixed top-20 right-4 p-3 rounded-lg shadow-xl text-center ${bgColor} ${textColor} border-b-4 ${borderColor} animate-fade-in-down z-[9999]`} style={{ animationFillMode: 'forwards' }}>
            {message}
            <button onClick={onClose} className="ml-4 text-white font-bold opacity-75 hover:opacity-100 focus:outline-none">
                &times;
            </button>
        </div>
    );
};

// Privacy Policy Modal Component
const PrivacyPolicyModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]"
            onClick={onClose} // Close on outside click
        >
            <div 
                className="bg-white rounded-lg shadow-2xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative animate-fade-in-down"
                onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
                >
                    &times;
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 border-b pb-2">Privacy Policy</h2>
                <div className="text-gray-700 text-sm md:text-base space-y-3">
                    <p>
                        This Privacy Policy describes how ImageCompressor.ai ("we," "us," or "our") operates and collects, uses, and discloses information when you use our website.
                    </p>
                    <p>
                        <strong>Data Collection:</strong> We do not collect any personal information from users. All image compression processes occur client-side, directly in your browser. Your images and data are never uploaded to our servers.
                    </p>
                    <p>
                        <strong>Log Data:</strong> We do not collect log data from your interactions with the site as no data is processed on our servers.
                    </p>
                    <p>
                        <strong>Cookies and Tracking:</strong> We do not use cookies or any third-party tracking technologies.
                    </p>
                    <p>
                        <strong>Third-Party Services:</strong> Our website may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                    </p>
                    <p>
                        <strong>Changes to This Privacy Policy:</strong> We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
                    </p>
                    <p>
                        <strong>Contact Us:</strong> If you have any questions about this Privacy Policy, please contact us at <a href="mailto:contact@imagecompressor.ai" className="text-indigo-600 hover:underline">contact@imagecompressor.ai</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};


export default function ImageCompressorApp() {
    const [selectedFile, setSelectedFile] = useState(null); // Changed from originalFile to selectedFile for consistency
    const [previewUrl, setPreviewUrl] = useState('');
    const [compressionLevel, setCompressionLevel] = useState(70);
    const [isCompressing, setIsCompressing] = useState(false); // Renamed from isProcessing
    const [isRealCompressorLoaded, setIsRealCompressorLoaded] = useState(false);
    const [toast, setToast] = useState(null); // { message: '...', type: 'success' | 'error' | 'info' }
    const [compressedHistory, setCompressedHistory] = useState([]);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    // New state for ad blocker detection
    const [showAdBlockMessage, setShowAdBlockMessage] = useState(false);

    const fileInputRef = useRef(null);
    const howItWorksRef = useRef(null);
    const mainCompressorRef = useRef(null); // Ref for the main compressor section to scroll to

    // Function to show toast messages
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000); // Hide toast after 3 seconds
    };

    // Effect to check if CompressorJS is loaded from CDN, or use the dummy if not
    useEffect(() => {
        const checkCompressor = setInterval(() => {
            if (typeof window.Compressor !== 'undefined') {
                setIsRealCompressorLoaded(true);
                clearInterval(checkCompressor);
                console.log("Actual CompressorJS from CDN detected.");
            } else {
                setIsRealCompressorLoaded(false);
                clearInterval(checkCompressor);
                console.log("Using internal DummyCompressor class for simulation.");
            }
        }, 200);

        return () => clearInterval(checkCompressor);
    }, []);

    // Ad Blocker Detection Logic
    useEffect(() => {
        const detectAdBlock = () => {
            let adBlockDetected = false;
            // Common method: Try to load a dummy ad script or element
            // In a real scenario, you'd use a known ad network script path
            // For sandbox, we simulate it or use a well-known ad class name.
            try {
                const testAd = document.createElement('div');
                testAd.className = 'ad-test-class-name'; // A class name often targeted by ad blockers
                testAd.style.position = 'absolute';
                testAd.style.left = '-9999px';
                testAd.style.height = '1px';
                testAd.style.width = '1px';
                document.body.appendChild(testAd);

                // Check if the element's offsetHeight/Width is zero (blocked) or if it's hidden
                // Give it a tiny delay for ad blockers to act
                setTimeout(() => {
                    if (testAd.offsetHeight === 0 || testAd.offsetParent === null || window.getComputedStyle(testAd).getPropertyValue('display') === 'none') {
                        adBlockDetected = true;
                    }
                    document.body.removeChild(testAd);
                    setShowAdBlockMessage(adBlockDetected);
                    if (adBlockDetected) {
                        showToast("It looks like you have an ad blocker enabled. Please consider disabling it to support our free service.", "info");
                    }
                }, 100); // Short delay to allow ad blockers to act
            } catch (e) {
                // If there's an error creating/appending the element, it might also indicate blocking
                console.error("Ad blocker detection error:", e);
                setShowAdBlockMessage(true);
                showToast("It looks like you have an ad blocker enabled. Please consider disabling it to support our free service.", "info");
            }
        };

        detectAdBlock();
    }, []); // Run once on component mount

    // Scroll to How It Works section
    const scrollToHowItWorks = () => {
        howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle file change (upload)
    const handleFileChange = (e) => {
        showToast("Processing file...", "info");
        setSelectedFile(null); // Use selectedFile consistently
        setCompressedHistory([]); // Clear history on new file upload for simplicity
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setCompressionLevel(70); // Reset compression level
        setToast(null); // Clear any existing toasts

        const file = e.target.files[0];

        if (!file) {
            showToast("No file selected.", "error");
            return;
        }

        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            showToast("Unsupported file type. Please upload JPG, JPEG, PNG, GIF, or WEBP images.", "error");
            // Important: Clear the input value to allow selecting the same file again immediately
            e.target.value = ''; 
            return;
        }

        if (file.size > 20 * 1024 * 1024) { // 20 MB limit
            showToast("File size should be less than 20MB.", "error");
            // Important: Clear the input value to allow selecting the same file again immediately
            e.target.value = ''; 
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        showToast("Image uploaded successfully!", "success");

        // Important: Clear the input value to allow selecting the same file again immediately
        e.target.value = ''; 
    };

    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    // Handle file drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange({ target: { files: [e.dataTransfer.files[0]], value: '' } }); // Simulate event with value reset
        }
    };

    // Initiate compression
    const handleCompress = useCallback(() => { // Renamed from compressImage to handleCompress for consistency
        if (!selectedFile) {
            showToast("Please upload an image to compress.", "error");
            return;
        }

        showToast("Compressing image...", "info");
        const CompressorToUse = isRealCompressorLoaded ? window.Compressor : Compressor; // Using global Compressor or local dummy

        setIsCompressing(true);
        // setCompressedFile(null); // No longer needed as we store in history
        setToast(null); // Clear previous toasts
        // Removed compressionProgress here, now handled by the Compressor's progress callback

        new CompressorToUse(selectedFile, {
            quality: compressionLevel / 100,
            
            // Progress callback for UI feedback
            progress(percentage) {
                // If you want a progress bar, you'd update a state here
                // For now, we just log it or use it for the dummy compressor above
                // setCompressionProgress(Math.round(percentage));
            },
            success(result) {
                const fileNameToUse = result.name || (() => {
                    const originalFileNameParts = selectedFile.name.split('.');
                    const extension = originalFileNameParts.pop();
                    const baseName = originalFileNameParts.join('.');
                    return `${baseName}_ai.${extension}`;
                })();

                const fileToDownload = new Blob([result], { type: result.type });
                Object.defineProperty(fileToDownload, 'name', { value: fileNameToUse, writable: false });

                // Add to history stack
                setCompressedHistory(prevHistory => [
                    {
                        id: Date.now(), // Unique ID for key prop
                        originalFileName: selectedFile.name,
                        originalSize: selectedFile.size,
                        compressedFileName: fileNameToUse,
                        compressedSize: result.size,
                        compressedBlob: fileToDownload, // Store the Blob for download
                    },
                    ...prevHistory // Add new item to the top
                ]);

                setIsCompressing(false);
                showToast(`Image compressed successfully! Saved ${(100 - (result.size / selectedFile.size) * 100).toFixed(1)}%`, "success");

                // Clear current selection after successful compression to ready for next upload
                setSelectedFile(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl('');
                setCompressionLevel(70); // Reset for next use
            },
            error(err) {
                showToast(`Compression failed: ${err.message}. Please try again.`, "error");
                setIsCompressing(false);
            },
        });
    }, [selectedFile, compressionLevel, isRealCompressorLoaded, previewUrl, showToast]);


    // Handle download from history or current compressed file
    const handleDownload = (fileBlob, fileName) => {
        if (!fileBlob || !fileName) {
            showToast("Error: No file data to download.", "error");
            return;
        }
        const url = URL.createObjectURL(fileBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up the object URL
        showToast("Image downloaded!", "success");
    };

    // Handle sharing of compressed image
    const handleShare = useCallback(async (fileBlob, fileName) => {
        if (!fileBlob) {
            showToast("No compressed file to share.", "error");
            return;
        }

        // Create a File object from the Blob to use with Web Share API
        const shareFile = new File([fileBlob], fileName, { type: fileBlob.type });

        if (navigator.share && navigator.canShare({ files: [shareFile] })) {
            try {
                await navigator.share({
                    files: [shareFile],
                    title: `Compressed Image - ${fileName}`,
                    text: `Check out this image I compressed using ImageCompressor.ai!`,
                });
                showToast("Image shared successfully!", "success");
            } catch (error) {
                if (error.name === 'AbortError') {
                    showToast("Sharing cancelled.", "info");
                } else {
                    console.error('Error sharing:', error);
                    showToast(`Failed to share image: ${error.message}`, "error");
                }
            }
        } else {
            // Fallback for browsers that don't support Web Share API with files
            // For now, we'll suggest manual download and share.
            showToast("Your browser does not support sharing files directly. Please download and share manually.", "info");
            // Optionally, you could trigger a download here as a fallback
            // handleDownload(fileBlob, fileName); // Removed to avoid double toast/action unless explicitly desired
        }
    }, [showToast]);

    // Utility to format file size
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Clean up object URL when component unmounts or previewUrl changes
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const clearHistory = () => {
        setCompressedHistory([]);
        showToast("Compression history cleared!", "info");
    };

    // Define the vibrant color for the SVG logo
    const logoColor = "#1E90FF"; // A strong blue color, looks great on both light and dark

    return (
        <div className="min-h-screen bg-gray-50 font-inter text-gray-800 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-md py-4 px-6 md:px-8">
                <nav className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                    <a href="#" className="flex items-center space-x-2 text-indigo-700 rounded-md mb-2 sm:mb-0">
                        {/* Custom SVG Logo with fixed vibrant color */}
                        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="6" width="20" height="14" rx="2" fill={logoColor} stroke={logoColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 6V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="8" cy="12" r="1.5" fill="#FFFFFF"/>
                            <circle cx="16" cy="12" r="1.5" fill="#FFFFFF"/>
                            <path d="M19 19L17 17M17 19L19 17" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5 19L7 17M7 19L5 17" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-2xl font-bold">ImageCompressor.ai</span>
                    </a>
                    <div className="flex flex-wrap justify-center space-x-4"> {/* Use flex-wrap for mobile */}
                        <a href="#" className="text-gray-600 hover:text-indigo-700 transition-colors rounded-md px-3 py-2">
                            Compress
                        </a>
                        <button onClick={scrollToHowItWorks} className="text-gray-600 hover:text-indigo-700 transition-colors rounded-md px-3 py-2">
                            How it Works
                        </button>
                    </div>
                </nav>
            </header>

            <main className="flex-grow">
                {/* Ad Blocker Message */}
                {showAdBlockMessage && (
                    <div className="container mx-auto px-4 mt-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center animate-fade-in-down">
                        <p className="font-semibold mb-1">Ad Blocker Detected!</p>
                        <p className="text-sm">Please consider disabling your ad blocker for this site to support our free service. Ads help keep ImageCompressor.ai running!</p>
                    </div>
                )}

                {/* Ad Placeholder 1 */}
                <div className="container mx-auto px-4 py-8 text-center">
                    <div className="bg-gray-200 h-24 md:h-32 flex items-center justify-center text-gray-600 text-sm rounded-lg shadow-sm px-4">
                        <p className="text-center">[Advertisement: Your AdSense Banner Here]</p>
                    </div>
                </div>

                {/* Hero Section / Compressor UI */}
                <section ref={mainCompressorRef} id="compress-section" className="relative bg-gradient-to-br from-indigo-50 to-purple-100 py-12 md:py-20 text-center px-4"> {/* Adjusted vertical padding, added horizontal */}
                    <div className="container mx-auto max-w-4xl"> {/* Increased max-width for better use of space */}
                        <h1 className="text-3xl md:text-5xl font-extrabold text-indigo-800 leading-tight mb-4 md:mb-6"> {/* Adjusted text sizes */}
                            Compress Images Online — <br className="hidden md:inline"/> Free, Unlimited JPG & PNG Compressor
                        </h1>
                        <p className="text-base md:text-xl text-gray-700 mb-8 md:mb-10 max-w-2xl mx-auto px-4"> {/* Adjusted text sizes, added px */}
                            Fast, private, and free online image compressor for JPG, PNG, and GIF. Your files never leave your device. Optimize images for web, email, and forms instantly.
                        </p>

                        <div
                            className="bg-white p-6 md:p-10 rounded-xl shadow-lg border border-gray-200 max-w-3xl mx-auto flex flex-col items-center"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div
                                className="border-2 border-dashed border-indigo-300 rounded-xl p-6 md:p-8 w-full cursor-pointer hover:border-indigo-500 transition-all duration-200"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp,image/jpg"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center text-gray-500">
                                    {/* Replaced generic file upload SVG with the custom logo SVG */}
                                    <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 md:h-16 md:w-16">
                                        <rect x="2" y="6" width="20" height="14" rx="2" fill={logoColor} stroke={logoColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M7 6V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="8" cy="12" r="1.5" fill="#FFFFFF"/>
                                        <circle cx="16" cy="12" r="1.5" fill="#FFFFFF"/>
                                        <path d="M19 19L17 17M17 19L19 17" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M5 19L7 17M7 19L5 17" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <p className="text-xl md:text-2xl font-semibold mb-1">Drag & Drop your image here</p> {/* Adjusted text sizes */}
                                    <p className="text-sm md:text-base">or <span className="text-indigo-600 font-medium">click to upload</span></p> {/* Adjusted text sizes */}
                                    <p className="text-xs md:text-sm mt-2">(JPG, JPEG, PNG, GIF, WEBP files are supported, max 20MB)</p> {/* Adjusted text sizes */}
                                </div>
                            </div>

                            {!isRealCompressorLoaded && (
                                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md shadow-sm w-full text-center text-sm md:text-base"> {/* Adjusted text size */}
                                    <strong>Note:</strong> Actual image compression library (Compressor.js CDN) not detected. Compression results will be **simulated** for demonstration.
                                </div>
                            )}

                            {selectedFile && (
                                <div className="mt-6 w-full"> {/* Adjusted margin-top */}
                                    <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-3">Selected Image:</h3> {/* Adjusted text size */}
                                    <div className="flex flex-col md:flex-row items-center justify-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        {previewUrl && (
                                            <img src={previewUrl} alt="Original Preview" className="max-w-[120px] max-h-[120px] md:max-w-[150px] md:max-h-[150px] rounded-md shadow-md object-contain mb-4 md:mb-0 md:mr-6 animate-fade-in-scale" />
                                        )}
                                        <div className="text-left w-full md:w-auto"> {/* Ensure text takes full width on mobile */}
                                            <p className="text-base md:text-lg font-medium text-gray-800 break-words"><span className="font-semibold">File Name:</span> {selectedFile.name}</p> {/* Changed from fileName to selectedFile.name */}
                                            <p className="text-sm md:text-base text-gray-600"><span className="font-semibold">Original Size:</span> {formatBytes(selectedFile.size)}</p> {/* Adjusted text size */}
                                            <div className="mt-3 w-full"> {/* Adjusted margin-top */}
                                                <label htmlFor="compression-slider" className="block text-gray-700 text-sm font-bold mb-2">
                                                    Compression Level: {compressionLevel}%
                                                </label>
                                                <input
                                                    type="range"
                                                    id="compression-slider"
                                                    min="10"
                                                    max="100"
                                                    value={compressionLevel}
                                                    onChange={(e) => setCompressionLevel(Number(e.target.value))}
                                                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer range-lg transition-colors duration-200"
                                                    style={{ '--webkit-slider-thumb-bg': '#6366f1', '--moz-range-thumb-bg': '#6366f1' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCompress}
                                        disabled={isCompressing}
                                        className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out
                                        flex items-center justify-center transform hover:scale-105 active:scale-95 text-base md:text-lg"
                                    >
                                        {isCompressing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Compressing...
                                            </>
                                        ) : "Compress Image"}
                                    </button>
                                </div>
                            )}

                            {/* No longer displaying current compressedFile directly here as it's added to history */}

                        </div>
                        <p className="mt-6 text-xs md:text-sm text-gray-600 px-4"> {/* Adjusted margin-top, added px */}
                            No signup, no upload limits, compress images privately and fast!
                        </p>
                    </div>
                </section>

                {/* Compressed Images History Section */}
                {compressedHistory.length > 0 && (
                    <section id="compression-history" className="py-12 md:py-20 bg-gray-100 px-4"> {/* Adjusted vertical padding, added horizontal */}
                        <div className="container mx-auto max-w-4xl">
                            <h2 className="text-2xl md:text-4xl font-extrabold text-center text-indigo-800 mb-8 md:mb-12"> {/* Adjusted text sizes */}
                                Compression History
                                <span className="block text-sm md:text-base font-normal text-gray-600 mt-1 md:mt-2"> {/* Adjusted text sizes */}
                                    (This history is temporary and clears on page refresh)
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"> {/* Adjusted gap */}
                                {compressedHistory.map(item => (
                                    <div key={item.id} className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center text-center animate-fade-in"> {/* Adjusted padding */}
                                        <p className="text-base md:text-lg font-semibold text-gray-800 mb-2 break-words">{item.originalFileName}</p> {/* Adjusted text size */}
                                        <p className="text-xs md:text-sm text-gray-600 mb-3">Original: {formatBytes(item.originalSize)}</p> {/* Adjusted text size */}
                                        <p className="text-base md:text-lg font-bold text-indigo-600 mb-3">Compressed: {formatBytes(item.compressedSize)}</p> {/* Adjusted text size */}
                                        <p className="text-xs md:text-sm text-gray-500 mb-4">Reduction: {((1 - (item.compressedSize / item.originalSize)) * 100).toFixed(1)}%</p> {/* Adjusted text size */}
                                        <div className="flex flex-col sm:flex-row gap-2 mt-auto w-full"> {/* Buttons grouped and responsive */}
                                            <button
                                                onClick={() => handleDownload(item.compressedBlob, item.compressedFileName)}
                                                className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center justify-center transform hover:scale-105 active:scale-95 text-sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                                Download
                                            </button>
                                            <button
                                                onClick={() => handleShare(item.compressedBlob, item.compressedFileName)}
                                                className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center transform hover:scale-105 active:scale-95 text-sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M15 8a3 3 0 10-2.977-2.977l-3.328 1.664a3 3 0 100 4.626l3.328 1.664A3 3 0 1015 12a3 3 0 00-3-3 3.001 3.001 0 00-2.977 2.977l-3.328-1.664a3 3 0 100-4.626l3.328-1.664A3 3 0 105 8zm0 2a1 1 0 110-2 1 1 0 010 2zM5 6a1 1 0 110-2 1 1 0 010 2zm0 8a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center mt-10 md:mt-12"> {/* Adjusted margin-top */}
                                <button
                                    onClick={clearHistory}
                                    className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 text-base md:text-lg"
                                >
                                    Clear History
                                </button>
                            </div>
                        </div>
                    </section>
                )}


                {/* Ad Placeholder 2 */}
                <div className="container mx-auto px-4 py-8 text-center">
                    <div className="bg-gray-200 h-24 md:h-32 flex items-center justify-center text-gray-600 text-sm rounded-lg shadow-sm px-4">
                        <p className="text-center">[Advertisement: Your AdSense Banner Here]</p>
                    </div>
                </div>

                {/* FAQ / How It Works Section */}
                <section ref={howItWorksRef} id="how-it-works" className="py-12 md:py-20 bg-white px-4"> {/* Adjusted vertical padding, added horizontal */}
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-2xl md:text-4xl font-extrabold text-center text-indigo-800 mb-8 md:mb-12"> {/* Adjusted text sizes */}
                            Frequently Asked Questions
                        </h2>

                        <div className="space-y-6 md:space-y-8"> {/* Adjusted space-y */}
                            {/* FAQ Item 1 */}
                            <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200"> {/* Adjusted padding */}
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Is it really free?</h3> {/* Adjusted text sizes */}
                                <p className="text-sm md:text-base text-gray-700"> {/* Adjusted text sizes */}
                                    Yes, ImageCompressor.ai is completely free to use for everyone. There are no hidden costs, subscriptions, or limits on the number of images you can compress. Enjoy unlimited, high-quality image compression without spending a dime.
                                </p>
                            </div>

                            {/* FAQ Item 2 */}
                            <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">What formats are supported?</h3>
                                <p className="text-sm md:text-base text-gray-700">
                                    Our online compressor supports the most common image formats: JPEG, JPG, PNG, and GIF. Simply upload your image, and we'll handle the compression.
                                </p>
                            </div>

                            {/* FAQ Item 3 */}
                            <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Will quality reduce?</h3>
                                <p className="text-sm md:text-base text-gray-700">
                                    Our intelligent compression algorithms are designed to reduce file size significantly while preserving as much image quality as possible. You can also adjust the compression level using our slider to find the perfect balance between file size and visual fidelity.
                                </p>
                            </div>

                            {/* FAQ Item 4 */}
                            <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Is this secure/private?</h3>
                                <p className="text-sm md:text-base text-gray-700">
                                    Absolutely! Your privacy is our top priority. All image compression happens directly in your browser, on your device. Your files are never uploaded to our servers, ensuring 100% privacy and security.
                                </p>
                            </div>

                            {/* FAQ Item 5 */}
                            <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">What are the use cases?</h3>
                                <div className="text-gray-700">
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm md:text-base"> {/* Adjusted text size */}
                                        <li>Reducing file sizes for government forms and job portals that have strict upload limits.</li>
                                        <li>Optimizing images for your website or blog to improve loading speed and SEO.</li>
                                        <li>Shrinking photos for email attachments to ensure they send quickly.</li>
                                        <li>Saving storage space on your device.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-6 px-4 md:px-8"> {/* Adjusted vertical padding, added horizontal */}
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left text-sm md:text-base"> {/* Adjusted text size */}
                    <div className="mb-3 md:mb-0"> {/* Adjusted margin-bottom */}
                        <p className="text-gray-400">&copy; 2025 ImageCompressor.ai</p>
                        <p className="text-gray-400 mt-1">Made with ❤️ for fast & secure image compression</p>
                    </div>
                    <div className="flex flex-wrap justify-center space-x-4"> {/* Use flex-wrap for mobile */}
                        <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a>
                        {/* The contact link is commented out as requested */}
                        {/* <a href="mailto:contact@imagecompressor.ai" className="text-gray-300 hover:text-white transition-colors">Contact</a> */}
                    </div>
                </div>
            </footer>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Privacy Policy Modal */}
            <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
        </div>
    );
}
