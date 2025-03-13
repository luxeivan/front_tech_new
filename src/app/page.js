'use server'
import MainContent from "@/components/MainContent/MainContent";
import { auth } from "@/config/auth";
// import { auth, authConf } from "@/config/auth";
// import { auth } from "@/config/auth";
import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";

export default async function Home() {
   const session = await auth()
    console.log("page-session: ",session)
  // const { token } = useAuthStore();
  // const session = await getServerSession(authConf)
  // console.log(session);
  
  const { token } = false;
  return (
    <div >
      {session  &&
      <>
      <h1 style={{textAlign:"center"}}>Добро пожаловать {session.user?.name}</h1>
        <MainContent />
      </>
      }
      {!session &&
        <h1 style={{textAlign:"center",padding:20}}>Пожалуйста авторизируйтесь</h1>        
      }
    </div>
  );
}
