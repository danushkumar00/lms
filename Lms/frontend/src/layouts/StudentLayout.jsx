import Header from "../Components/Header"
import Footer from "../Components/Footer"
const StudentLayout = ({ children }) => { 
  return (
    <div className="flex flex-col min-h-screen">
      
  
      <Header>
        

        <h2 className="text-xl font-bold text-slate-800 text-center font-stretch-125%">SkillSync</h2>
              </Header>
      

      <main className="flex-1 w-full relative">
        {children} 
      </main>

   
      <Footer>
        © 2026 Portal. All rights reserved.
      </Footer>

    </div>
  );
};

export default StudentLayout;