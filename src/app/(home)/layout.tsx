import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
    return (

        <main className="flex flex-col min-h-screen max-h-screen">
            <Navbar />
            <div className="fixed top-0 left-0 w-full min-h-screen -z-10
  dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)]
  bg-[radial-gradient(#dadde2,transparent_1px)]
  [background-size:16px_16px]
                "/>
            <div className="flex-1 flex flex-col px-4 pb-4">
                {children}
            </div>
        </main>
    );
};
export default Layout;