import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    PayPopupContainer, 
    InnerContainer,
    Title,
    CloseIcon,
    Text,
    Row, 
    Input,
    Label,
    ButtonContainer,
    Button,
    ButtonPayPal
} from './PayPopup.styled';
import payPal from '../../assets/images/payPalLogo.png';
import ApplePay from '../ApplePay/ApplePay';

export interface PayPopupProps {
    onClose: () => void;
    imageIds: number[];
    showAllPhotosOnly?: boolean; 
};

const PayPopup: React.FC<PayPopupProps> = ({ onClose, imageIds, showAllPhotosOnly = false }) => {
    const [selectedOption, setSelectedOption] = useState<'photos' | 'photo' | null>(null);
    const [allImageIds, setAllImageIds] = useState<number[]>([]);
    const [unpaidPhotoCount, setUnpaidPhotoCount] = useState(0); 
    const [singleImageId, setSingleImageId] = useState<number | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const decodedAlbumId = decodeURIComponent(location.pathname.split("/").pop() || "");
    const pricePerPhoto = 100; 
    const totalPrice = pricePerPhoto * unpaidPhotoCount;

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        const fetchAlbumData = async () => {
            try {
                const response = await axios.get('https://photodrop-dawn-surf-6942.fly.dev/client/images', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const albumData = response.data.find((album: any) => album.location === decodedAlbumId);
                if (albumData) {
                    const unpurchasedImageIds = albumData.images
                        .filter((image: any) => !image.isPurchased)
                        .map((image: any) => image.id);
                    
                    if (unpurchasedImageIds.length > 0) {
                        setAllImageIds(unpurchasedImageIds);
                        setUnpaidPhotoCount(unpurchasedImageIds.length); 
                    } else {
                        setUnpaidPhotoCount(0); 
                    }
                } else {
                    setUnpaidPhotoCount(0); 
                }
            } catch (error) {
                console.error("Error fetching images:", error);
            }
        };
        fetchAlbumData();
    }, [decodedAlbumId]);

    useEffect(() => {
        if (showAllPhotosOnly) {
            setSelectedOption('photos');
        } else if (imageIds.length === 1) {
            setSelectedOption('photo');
            setSingleImageId(imageIds[0]);
        } else {
            setSelectedOption('photos');
        }
    }, [showAllPhotosOnly, imageIds]);

    const calculatePrice = (): number => {
        if (selectedOption === 'photos') {
            return totalPrice;
        } else if (selectedOption === 'photo' && singleImageId !== null) {
            return pricePerPhoto;
        }
        return 0;
    };

    const handleCheckout = async (paymentMethod: string) => {
        let selectedImageIds: number[] = [];
        let selectedPrice = calculatePrice();
    
        if (selectedOption === 'photos') {
            if (allImageIds.length === 0) {
                console.error("No image IDs to process the payment.");
                alert("No images available for purchase.");
                return;
            }
            selectedImageIds = allImageIds;
        } else if (selectedOption === 'photo') {
            if (singleImageId === null) {
                console.error("No single image ID to process the payment.");
                alert("No image available for purchase.");
                return;
            }
            selectedImageIds = [singleImageId].filter((id): id is number => id !== null);
        }
        navigate('/payment', { state: { imageIds: selectedImageIds, price: selectedPrice, paymentMethod } });
    };
    
    const isAlbumDetailsPage = location.pathname.startsWith('/albumDetails') && decodedAlbumId;

    return (
        <PayPopupContainer>
            <InnerContainer>
                <CloseIcon onClick={onClose} />
                <Title>Unlock your photos</Title>
                <Text>
                    Download, view, and share your photos in hi-resolution with no watermark.
                </Text>
                {showAllPhotosOnly ? (
                    <Row>
                        <Input 
                            type="radio" 
                            name="photoOption" 
                            id="photos" 
                            checked={selectedOption === 'photos'} 
                            readOnly
                        />
                        <Label htmlFor="photos">
                            <span>All {unpaidPhotoCount} photos from {decodedAlbumId}</span> 
                            <span>${totalPrice / 100}</span>
                        </Label>
                    </Row>
                ) : (
                    <>
                        <Row>
                            <Input 
                                type="radio" 
                                name="photoOption" 
                                id="photo" 
                                checked={selectedOption === 'photo'} 
                                onChange={() => setSelectedOption('photo')}
                            />
                            <Label htmlFor="photo">
                                <span>Current Photo</span>
                                <span>${pricePerPhoto / 100}</span>
                            </Label>
                        </Row>
                        {isAlbumDetailsPage && (
                            <Row>
                                <Input 
                                    type="radio" 
                                    name="photoOption" 
                                    id="photos" 
                                    checked={selectedOption === 'photos'} 
                                    onChange={() => setSelectedOption('photos')}
                                />
                                <Label htmlFor="photos">
                                    <span>All {unpaidPhotoCount} photos from {decodedAlbumId}</span> 
                                    <span>${totalPrice / 100}</span>
                                </Label>
                            </Row>
                        )}
                    </>
                )}
                <ApplePay 
                    imageIds={allImageIds.length > 0 ? allImageIds : [singleImageId].filter((id): id is number => id !== null)}
                    onClose={onClose}
                    amount={calculatePrice()} 
                />
                <ButtonContainer>
                    <Button onClick={() => handleCheckout('card')}>Checkout</Button>
                    <ButtonPayPal onClick={() => handleCheckout('paypal')}>
                        <img src={payPal} alt="PayPal" />
                    </ButtonPayPal>
                </ButtonContainer>
            </InnerContainer>
        </PayPopupContainer>
    );
}

export default PayPopup;
