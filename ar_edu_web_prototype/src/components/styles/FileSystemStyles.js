const fileBlockStyles = {
    container: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '1rem',
      marginTop: '1rem',
      backgroundColor: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      
    },
    title: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#333'
    },
    uploadContainer: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1rem',
      alignItems: 'center',
      justifyContent: 'center'
    },
    fileInput: {
      border: '1px solid #e0e0e0',
      padding: '0.5rem',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9'
    },
    uploadButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
      '&:hover': {
        backgroundColor: '#45a049'
      },
      '&:disabled': {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed'
      }
    },
    fileList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    fileItem: {
      padding: '0.5rem',
      borderBottom: '1px solid #eee',
      '&:last-child': {
        borderBottom: 'none'
      }
    },
    fileLink: {
      color: '#2196F3',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline'
      }
    }
  };
  
  export default fileBlockStyles;