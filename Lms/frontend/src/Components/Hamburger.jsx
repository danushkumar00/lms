import { HamburgerMenuOverlay } from "./lightswind/hamburger-menu-overlay";

const menuItems = [
    
    {label:"Profile", href:"/SignIn"},
    {label:"FAQ"},
    {label:"Contact Us"},
];

const Hamburger = () =>{
return(
    <>
    <HamburgerMenuOverlay items={menuItems} />
    </>
)

}
export default Hamburger