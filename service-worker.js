self.addEventListener('push', function(event) {
  if (event.data) {
    console.log('Push event!! ', event.data);
  } else {
    console.log('Push event but no data')
  }
})