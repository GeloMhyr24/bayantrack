import { useEffect, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { Chatbot } from "@/components/Chatbot";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";

type Department = {
  _id: string;
  name: string;
  contactPerson: string;
  localNumber: string;
};

export default function Contact() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [siteContent, setSiteContent] = useState({
    contactOfficeHours: "Monday - Friday, 8:00 AM - 5:00 PM",
    contactLocationText: "Barangay Mambog II Hall, Bacoor City, Cavite",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, contentRes] = await Promise.all([
          api.get("/api/contact/departments"),
          api.get("/api/content/site"),
        ]);
        setDepartments(deptRes.data || []);
        if (contentRes?.data) {
          setSiteContent((prev) => ({
            contactOfficeHours: contentRes.data.contactOfficeHours || prev.contactOfficeHours,
            contactLocationText: contentRes.data.contactLocationText || prev.contactLocationText,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch contact data", err);
      }
    };

    void fetchData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              
                <div>
                  <h1 className="text-3xl font-bold text-[#395886]">Contact Us</h1>
                  <p className="mt-3 text-slate-600">
                    Contact submission to the database is currently disabled. Please use the directory below for direct coordination.
                  </p>
                </div>
              

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <Clock className="mb-4 text-[#395886]" size={30} />
                  <h3 className="font-bold text-slate-900">Office Hours</h3>
                  <p className="mt-1 text-sm text-slate-600">{siteContent.contactOfficeHours}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <MapPin className="mb-4 text-[#395886]" size={30} />
                  <h3 className="font-bold text-slate-900">Location</h3>
                  <p className="mt-1 text-sm text-slate-600">{siteContent.contactLocationText}</p>
                </div>
              </div>

              <div>
                <h2 className="mb-5 text-2xl font-bold text-[#395886]">Department Directory</h2>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-[640px] w-full text-left text-sm">
                    <thead className="border-b bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-4">Department</th>
                        <th className="p-4">Contact Person</th>
                        <th className="p-4">Local No.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {departments.map((dept) => (
                        <tr key={dept._id}>
                          <td className="p-4">{dept.name}</td>
                          <td className="p-4">{dept.contactPerson}</td>
                          <td className="p-4">{dept.localNumber}</td>
                        </tr>
                      ))}
                      {departments.length === 0 ? (
                        <tr>
                          <td className="p-4 text-slate-500" colSpan={3}>
                            No departments found.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="mb-4 text-xl font-bold text-[#395886]">Message</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Message..
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
