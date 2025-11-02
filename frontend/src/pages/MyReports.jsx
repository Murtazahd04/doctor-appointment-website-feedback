import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { FaTrash } from 'react-icons/fa'

const MyReports = () => {
    const { backendUrl, token } = useContext(AppContext)

    const [reports, setReports] = useState([])
    const [showUploadForm, setShowUploadForm] = useState(false)
    const [reportName, setReportName] = useState('')
    const [reportDescription, setReportDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [deletingIndex, setDeletingIndex] = useState(null)

    // Format date for display
    const formatDate = (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    // Get user reports from API
    const getReports = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/reports', { headers: { token } })
            if (data.success) {
                setReports([...data.reports].reverse()) // Reverse to show newest first (create new array to avoid mutation)
            } else {
                setReports([])
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
        }
    }

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate PDF file
            if (file.type !== 'application/pdf') {
                toast.error('Please upload a PDF file')
                return
            }
            setSelectedFile(file)
        }
    }

    // Upload report
    const uploadReport = async () => {
        if (!reportName.trim()) {
            toast.error('Please enter report name')
            return
        }
        if (!reportDescription.trim()) {
            toast.error('Please enter report description')
            return
        }
        if (!selectedFile) {
            toast.error('Please select a PDF file')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('pdf', selectedFile)
            formData.append('reportName', reportName)
            formData.append('description', reportDescription)

            const { data } = await axios.post(
                backendUrl + '/api/user/upload-report',
                formData,
                { 
                    headers: { 
                        token,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            )

            if (data.success) {
                toast.success(data.message || 'Report uploaded successfully')
                // Reset form
                setReportName('')
                setReportDescription('')
                setSelectedFile(null)
                setShowUploadForm(false)
                // Refresh reports list
                await getReports()
            } else {
                toast.error(data.message || 'Failed to upload report')
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setUploading(false)
        }
    }

    // Delete report
    const deleteReport = async (displayIndex) => {
        // Calculate original index (reports array is reversed for display)
        const originalIndex = reports.length - 1 - displayIndex
        
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return
        }

        setDeletingIndex(displayIndex)
        try {
            const { data } = await axios.delete(
                `${backendUrl}/api/user/delete-report/${originalIndex}`,
                { headers: { token } }
            )

            if (data.success) {
                toast.success(data.message || 'Report deleted successfully')
                // Refresh reports list
                await getReports()
            } else {
                toast.error(data.message || 'Failed to delete report')
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setDeletingIndex(null)
        }
    }

    useEffect(() => {
        if (token) {
            getReports()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    return (
        <div>
            <div className='flex items-center justify-between pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>
                <p>My Reports</p>
                <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className='px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600'
                >
                    {showUploadForm ? 'Cancel' : 'Add New Report'}
                </button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
                <div className='mt-6 p-6 border rounded-lg bg-gray-50'>
                    <h3 className='text-base font-semibold mb-4'>Upload Report</h3>
                    
                    {/* File Upload */}
                    <div className='mb-4'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Upload PDF Report
                        </label>
                        <div className='flex items-center gap-4'>
                            <label className='cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100'>
                                <img src={assets.upload_icon} alt="Upload" className='w-5 h-5' />
                                <span className='text-sm text-gray-600'>
                                    {selectedFile ? selectedFile.name : 'Choose PDF File'}
                                </span>
                                <input
                                    type='file'
                                    accept='application/pdf'
                                    onChange={handleFileChange}
                                    className='hidden'
                                />
                            </label>
                        </div>
                    </div>

                    {/* Report Name */}
                    <div className='mb-4'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Report Name
                        </label>
                        <input
                            type='text'
                            value={reportName}
                            onChange={(e) => setReportName(e.target.value)}
                            placeholder='Enter report name'
                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                        />
                    </div>

                    {/* Description */}
                    <div className='mb-4'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Description
                        </label>
                        <textarea
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            placeholder='Enter report description'
                            rows={4}
                            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none'
                        />
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={uploadReport}
                        disabled={uploading}
                        className='px-6 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
                    >
                        {uploading ? 'Uploading...' : 'Upload Report'}
                    </button>
                </div>
            )}

            {/* Reports List */}
            <div className='mt-6'>
                {reports.length === 0 ? (
                    <div className='text-center py-12 text-gray-500'>
                        <p>No reports uploaded yet</p>
                        <p className='text-sm mt-2'>Click "Add New Report" to upload your first report</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {reports.map((report, index) => (
                            <div key={index} className='border rounded-lg p-4 bg-white hover:shadow-md transition-shadow'>
                                <div className='flex items-start justify-between mb-3'>
                                    <h4 className='text-base font-semibold text-gray-800 flex-1'>
                                        {report.reportName}
                                    </h4>
                                    <button
                                        onClick={() => deleteReport(index)}
                                        disabled={deletingIndex === index}
                                        className='text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors p-1'
                                        title='Delete report'
                                    >
                                        <FaTrash className='w-4 h-4' />
                                    </button>
                                </div>
                                <p className='text-sm text-gray-600 mb-3 line-clamp-3'>
                                    {report.description}
                                </p>
                                <div className='flex items-center justify-between'>
                                    <span className='text-xs text-gray-500'>
                                        {formatDate(report.uploadedAt)}
                                    </span>
                                    <div className='flex items-center gap-2'>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    // Use backend endpoint with pdfUrl to avoid index calculation issues
                                                    const response = await axios.get(
                                                        `${backendUrl}/api/user/report-pdf-by-url`,
                                                        {
                                                            headers: { token },
                                                            params: { pdfUrl: report.pdfUrl },
                                                            responseType: 'blob'
                                                        }
                                                    )
                                                    
                                                    // Create blob URL and open in new window
                                                    const blob = new Blob([response.data], { type: 'application/pdf' })
                                                    const blobUrl = window.URL.createObjectURL(blob)
                                                    window.open(blobUrl, '_blank')
                                                    
                                                    // Clean up blob URL after a delay
                                                    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
                                                } catch (error) {
                                                    console.error('Error loading PDF:', error)
                                                    toast.error('Failed to load PDF')
                                                }
                                            }}
                                            className='text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none'
                                        >
                                            View PDF
                                            <img src={assets.arrow_icon} alt="Open" className='w-3 h-3' />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    // Download PDF by fetching and creating blob
                                                    const response = await fetch(report.pdfUrl)
                                                    const blob = await response.blob()
                                                    const url = window.URL.createObjectURL(blob)
                                                    const link = document.createElement('a')
                                                    link.href = url
                                                    link.download = report.reportName.replace(/\s+/g, '_') + '.pdf'
                                                    document.body.appendChild(link)
                                                    link.click()
                                                    document.body.removeChild(link)
                                                    window.URL.revokeObjectURL(url)
                                                } catch (error) {
                                                    console.error('Download error:', error)
                                                    toast.error('Failed to download PDF')
                                                }
                                            }}
                                            className='text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer'
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyReports

