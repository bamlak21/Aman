import { useState, useEffect } from "react";
import { Users, Search, MoreVertical, UserPlus, RefreshCw } from "lucide-react";
import { admin } from "../api/admin.api";
import UserRegModal from "../components/UserRegModal";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import axios from "axios";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  status: string;
};
type message ={
  message:string;
}
const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>();
  const [openModal,setOpenModal]=useState(false);
  const [openRevModal,setOpenRevModal]=useState(false)
  const loadUsers = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const Users:UserData[]= await admin.users()
      setUsers(Users||[]);
      
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const revoke = async(userId:string,isActive:boolean) =>{
    
    try
    {
      const data = await admin.suspendUser(userId,isActive) 
      // toast.success("Suspend Successfully");
      return data
    }
    catch(error){
      if(axios.isAxiosError<message>(error)){
      toast.error(error.response?.data.message??"Suspention failed");
      }
      else{
        console.error("something wrong")
      }
    }
  } 
  
  if (loading) {
    return (
      <div className="flex flex-col p-6 w-full min-h-full">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 w-full min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all registered users</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        onClick={()=>setOpenModal(true)}
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-0 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm"
            />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-500">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} />
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-sm text-gray-600">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === "payee"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === "active" ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          setSelectedUser(selectedUser === user.id ? null : user.id)
                        }
                        className="p-1 hover:bg-gray-200 rounded transition"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {selectedUser === user.id && (
                        <div className="absolute right-8 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-40">
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition">
                            View Details
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition">
                            Edit User
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition"
                          onClick={()=>{
                          setOpenRevModal(true)
                          setSelectedUser(user.id)
                          }}>
                            Suspend User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <UserRegModal
      isOpen={openModal}
      onClose={()=>setOpenModal(false)}
      />
      <ConfirmModal
      isOpen={openRevModal}
      title="Suspend User"
      message="Are you sure to suspend these user ?"
      cancelText="Cancel"
      confirmText="Ok"
      onCancel={()=>setOpenRevModal(false)}
      onConfirm={()=>{revoke(selectedUser,false)
        setOpenRevModal(false)
      }}/>
    </div>
  );
};

export default UsersPage;
