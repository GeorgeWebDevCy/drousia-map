jQuery(function($){
    $(document).on('click','.gn-photo-button',function(e){
        e.preventDefault();
        $(this).closest('form').find('.gn-photo-file').trigger('click');
    });

    $(document).on('change','.gn-photo-file',function(){
        const form = $(this).closest('form')[0];
        const statusEl = $(form).find('.gn-upload-status');
        const data = new FormData(form);
        data.append('ajax','1');
        statusEl.text('Uploading...');
        const url = form.getAttribute('action');
        fetch(url,{method:'POST',body:data,credentials:'same-origin'})
            .then(res=>res.json())
            .then(resp=>{
                if(resp.success){
                    statusEl.text('Upload received and awaiting approval.');
                    form.reset();
                } else {
                    statusEl.text('Error uploading file.');
                }
            })
            .catch(()=>statusEl.text('Error uploading file.'));
    });
});
