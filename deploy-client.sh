source deploy.env
echo "Running build";


# ### env management:
# TARGET=./client/.env
# SOURCE=client.env
# TMP=./client/tmp.env

# file_backup=0

# if [ -f "$TARGET" ]; then
#     file_backup=1
#     mv $TARGET $TMP
# fi

# cp $SOURCE $TARGET

npm --prefix client run build

# if [file_backup]; then
#     mv $TMP $TARGET
# fi

echo "Syncing built files to: s3://$UI_BUCKET_NAME/"
aws s3 sync client/build/ s3://$UI_BUCKET_NAME/
echo "Files synced successfully"

echo "Invalidating cloudfront distribution"

# aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST --paths "/*"